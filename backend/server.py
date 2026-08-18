from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, UploadFile, File, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from bson.errors import InvalidId
import os
import logging
import uuid
import hmac
import hashlib
import json
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from pymongo.errors import DuplicateKeyError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_transport

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB

# --- Config ---
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = os.environ.get('JWT_ALGORITHM', 'HS256')
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
GOOGLE_MODE = os.environ.get('GOOGLE_MODE', 'mock')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
MSG91_AUTH_KEY = os.environ.get('MSG91_AUTH_KEY', '')
ORDER_STATUS_TEMPLATES = {
    "confirmed": os.environ.get('MSG91_ORDER_CONFIRMED_TEMPLATE_ID', ''),
    "shipped": os.environ.get('MSG91_ORDER_SHIPPED_TEMPLATE_ID', ''),
    "delivered": os.environ.get('MSG91_ORDER_DELIVERED_TEMPLATE_ID', ''),
    "cancelled": os.environ.get('MSG91_ORDER_CANCELLED_TEMPLATE_ID', ''),
}
RAZORPAY_MODE = os.environ.get('RAZORPAY_MODE', 'mock')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
fs_bucket: Optional[AsyncIOMotorGridFSBucket] = None

def get_fs_bucket() -> AsyncIOMotorGridFSBucket:
    global fs_bucket
    if fs_bucket is None:
        fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="product_images")
    return fs_bucket

app = FastAPI(title="Premium Oils API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# --- Helpers ---
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

def make_token(payload: dict, hours: int = 24 * 30) -> str:
    data = {**payload, "exp": datetime.now(timezone.utc) + timedelta(hours=hours)}
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = decode_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if data.get("role") == "admin":
        return {"id": data.get("sub"), "role": "admin", "email": data.get("email")}
    user = await db.users.find_one({"id": data.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# --- Models ---
class GoogleAuthRequest(BaseModel):
    credential: str

class AdminLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None

class Address(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    mobile: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = ""
    is_default: bool = False

class AddressCreate(BaseModel):
    name: str
    mobile: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = ""
    is_default: bool = False

class ProductVariant(BaseModel):
    id: str = Field(default_factory=new_id)
    size: str  # "500ml", "1L", "5L"
    price: float
    mrp: float
    stock: int = 100

class Product(BaseModel):
    id: str = Field(default_factory=new_id)
    slug: str
    name: str
    category: str  # groundnut | coconut | almond
    short_description: str
    description: str
    image_url: str
    gallery: List[str] = []
    variants: List[ProductVariant]
    highlights: List[str] = []
    is_active: bool = True
    created_at: str = Field(default_factory=now_iso)

class ProductCreate(BaseModel):
    slug: str
    name: str
    category: str
    short_description: str
    description: str
    image_url: str
    gallery: List[str] = []
    variants: List[ProductVariant]
    highlights: List[str] = []
    is_active: bool = True

class OrderItem(BaseModel):
    product_id: str
    variant_id: str
    name: str
    size: str
    price: float
    qty: int
    image_url: str

class OrderCreate(BaseModel):
    items: List[OrderItem]
    address_id: str
    payment_method: str = "razorpay"  # razorpay | cod

class PaymentVerify(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, shipped, delivered, cancelled

# --- Startup: seed ---
@app.on_event("startup")
async def startup():
    get_fs_bucket()
    try:
        await db.users.drop_index("mobile_1")  # migrate off the old OTP-login unique-mobile index
    except Exception:
        pass
    await db.users.create_index("mobile", unique=True, sparse=True)
    await db.users.create_index("google_id", unique=True, sparse=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("razorpay_order_id")
    await db.orders.create_index("user_id")
    await db.addresses.create_index("user_id")
    # Seed admin (as a doc, mainly for reference; auth uses env)
    await seed_products_if_empty()
    logger.info("Startup complete - Admin: %s", ADMIN_EMAIL)

async def seed_products_if_empty():
    count = await db.products.count_documents({})
    if count > 0:
        return
    products = [
        Product(
            slug="cold-pressed-groundnut-oil",
            name="Cold-Pressed Groundnut Oil",
            category="groundnut",
            short_description="Traditional wood-pressed groundnut oil, unrefined & unfiltered.",
            description="Our cold-pressed groundnut oil is extracted from hand-picked, sun-dried peanuts using a traditional wooden ghani (kachi ghani). Rich in monounsaturated fats, vitamin E, and a natural nutty aroma. Perfect for everyday Indian cooking, tempering, and deep frying.",
            image_url="",
            gallery=[],
            variants=[
                ProductVariant(size="500ml", price=280, mrp=350, stock=100),
                ProductVariant(size="1L", price=520, mrp=650, stock=100),
                ProductVariant(size="5L", price=2450, mrp=3100, stock=50),
            ],
            highlights=["100% Pure & Natural", "Wood-Pressed Kachi Ghani", "No Chemicals or Preservatives", "Rich in Vitamin E"],
        ),
        Product(
            slug="virgin-coconut-oil",
            name="Virgin Coconut Oil",
            category="coconut",
            short_description="Pure virgin coconut oil, cold-pressed from fresh Kerala coconuts.",
            description="Cold-pressed from fresh, hand-selected coconuts sourced directly from Kerala farms. This unrefined virgin coconut oil retains its natural aroma, MCTs, and lauric acid — ideal for cooking, hair care, and skin nourishment.",
            image_url="",
            gallery=[],
            variants=[
                ProductVariant(size="500ml", price=340, mrp=420, stock=100),
                ProductVariant(size="1L", price=640, mrp=780, stock=100),
                ProductVariant(size="5L", price=2950, mrp=3600, stock=40),
            ],
            highlights=["Cold-Pressed Virgin", "Kerala Origin", "Rich in MCTs & Lauric Acid", "Multi-purpose: Food, Hair & Skin"],
        ),
        Product(
            slug="pure-almond-oil",
            name="Pure Sweet Almond Oil",
            category="almond",
            short_description="Premium cold-pressed sweet almond oil from best quality almonds.",
            description="Made from sun-ripened best quality almonds, our sweet almond oil is cold-pressed to preserve its light texture and delicate flavour. Packed with vitamin E, omega-3, and antioxidants. Ideal as a finishing oil, in baking, or for skin & hair regimens.",
            image_url="",
            gallery=[],
            variants=[
                ProductVariant(size="250ml", price=520, mrp=650, stock=80),
                ProductVariant(size="500ml", price=980, mrp=1200, stock=80),
                ProductVariant(size="1L", price=1850, mrp=2300, stock=40),
            ],
            highlights=["Best Quality Almonds", "Cold-Pressed & Unrefined", "High in Vitamin E", "Culinary & Cosmetic Grade"],
        ),
        Product(
            slug="filtered-groundnut-oil",
            name="Filtered Groundnut Oil (Family Pack)",
            category="groundnut",
            short_description="Everyday filtered groundnut oil — light, mildly flavoured, high smoke point.",
            description="Our filtered groundnut oil offers a lighter alternative to kachi ghani — mildly flavoured and with a high smoke point, perfect for daily Indian cooking and frying. Lab-tested for purity.",
            image_url="",
            gallery=[],
            variants=[
                ProductVariant(size="1L", price=210, mrp=260, stock=200),
                ProductVariant(size="5L", price=990, mrp=1250, stock=80),
                ProductVariant(size="15L", price=2790, mrp=3500, stock=20),
            ],
            highlights=["Lab-Tested Purity", "High Smoke Point", "Family Pack Value", "Naturally Cholesterol Free"],
        ),
    ]
    for p in products:
        doc = p.model_dump()
        await db.products.insert_one(doc)
    logger.info("Seeded %d products", len(products))

# --- MSG91 SMS ---
def _msg91_send(mobile: str, template_id: str, variables: dict) -> bool:
    if not MSG91_AUTH_KEY or not template_id:
        return False
    try:
        resp = requests.post(
            "https://control.msg91.com/api/v5/flow/",
            headers={"authkey": MSG91_AUTH_KEY, "accept": "application/json", "content-type": "application/json"},
            json={
                "template_id": template_id,
                "short_url": "0",
                "recipients": [{"mobiles": f"91{mobile}", **variables}],
            },
            timeout=10,
        )
        body = resp.json()
        if resp.ok and body.get("type") == "success":
            return True
        logger.error("MSG91 send failed: status=%s body=%s", resp.status_code, body)
        return False
    except requests.RequestException:
        logger.exception("MSG91 request failed")
        return False

def send_order_status_sms(mobile: str, order_id: str, status: str) -> None:
    """Best-effort order notification - never blocks or fails the order flow."""
    template_id = ORDER_STATUS_TEMPLATES.get(status)
    if not mobile or not template_id:
        return
    if not _msg91_send(mobile, template_id, {"ORDER_ID": order_id[:8]}):
        logger.error("Order status SMS failed: order=%s status=%s mobile=%s", order_id, status, mobile)

# --- Auth: Google Sign-In ---
@api.post("/auth/google")
async def google_login(data: GoogleAuthRequest):
    if GOOGLE_MODE == "live":
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=502, detail="Google sign-in is not configured")
        try:
            idinfo = google_id_token.verify_oauth2_token(
                data.credential, google_auth_transport.Request(), GOOGLE_CLIENT_ID
            )
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid Google credential")
        if not idinfo.get("email_verified"):
            raise HTTPException(status_code=401, detail="Google email not verified")
        google_id, email, name, picture = idinfo["sub"], idinfo.get("email", ""), idinfo.get("name", ""), idinfo.get("picture", "")
    else:
        # Mock mode (no real Google Cloud project configured yet): `credential` is a JSON
        # string standing in for a verified Google profile, so local dev/tests can exercise
        # this flow without hitting Google. See GOOGLE_MODE in env_config_conventions.
        try:
            profile = json.loads(data.credential)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid mock credential")
        google_id = profile.get("sub") or profile.get("email", "")
        if not google_id:
            raise HTTPException(status_code=400, detail="Mock credential needs a sub or email")
        email, name, picture = profile.get("email", ""), profile.get("name", ""), profile.get("picture", "")

    user = await db.users.find_one({"google_id": google_id}, {"_id": 0})
    if not user:
        user = {"id": new_id(), "google_id": google_id, "email": email, "name": name,
                "picture": picture, "created_at": now_iso()}
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"id": user["id"]}, {"$set": {"email": email, "name": name, "picture": picture}})
        user = {**user, "email": email, "name": name, "picture": picture}
    token = make_token({"sub": user["id"], "role": "user"})
    return {"token": token, "user": {k: v for k, v in user.items() if k != "_id"},
            "needs_mobile": not bool(user.get("mobile"))}

@api.post("/auth/admin/login")
async def admin_login(data: AdminLogin):
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = make_token({"sub": "admin", "role": "admin", "email": ADMIN_EMAIL})
    return {"token": token, "user": {"id": "admin", "role": "admin", "email": ADMIN_EMAIL}}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": {k: v for k, v in user.items() if k != "_id"}}

@api.put("/auth/me")
async def update_me(data: UserProfileUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Not applicable")
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if "mobile" in upd and not (upd["mobile"].isdigit() and len(upd["mobile"]) == 10):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")
    if upd:
        try:
            await db.users.update_one({"id": user["id"]}, {"$set": upd})
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="This mobile number is already linked to another account")
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"user": u}

# --- Products ---
@api.get("/products")
async def list_products(category: Optional[str] = None):
    q = {"is_active": True}
    if category and category != "all":
        q["category"] = category
    docs = await db.products.find(q, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"products": docs}

@api.get("/products/{slug}")
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc

@api.post("/admin/products")
async def create_product(data: ProductCreate, admin: dict = Depends(get_admin)):
    p = Product(**data.model_dump())
    doc = p.model_dump()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/admin/products/{product_id}")
async def update_product(product_id: str, data: ProductCreate, admin: dict = Depends(get_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    upd = data.model_dump()
    # Ensure variants have ids
    for v in upd["variants"]:
        if not v.get("id"):
            v["id"] = new_id()
    await db.products.update_one({"id": product_id}, {"$set": upd})
    return await db.products.find_one({"id": product_id}, {"_id": 0})

@api.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin)):
    res = await db.products.delete_one({"id": product_id})
    return {"deleted": res.deleted_count}

@api.post("/admin/upload")
async def upload_image(request: Request, file: UploadFile = File(...), admin: dict = Depends(get_admin)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP or GIF images are allowed")
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5MB")
    file_id = await get_fs_bucket().upload_from_stream(
        file.filename or "upload",
        contents,
        metadata={"content_type": file.content_type},
    )
    url = f"{str(request.base_url).rstrip('/')}/api/uploads/{file_id}"
    return {"url": url}

@api.get("/uploads/{file_id}")
async def get_upload(file_id: str):
    try:
        oid = ObjectId(file_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Image not found")
    try:
        stream = await get_fs_bucket().open_download_stream(oid)
        data = await stream.read()
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")
    content_type = (stream.metadata or {}).get("content_type", "application/octet-stream")
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )

# --- Addresses ---
@api.get("/addresses")
async def list_addresses(user: dict = Depends(get_current_user)):
    docs = await db.addresses.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    return {"addresses": docs}

@api.post("/addresses")
async def add_address(data: AddressCreate, user: dict = Depends(get_current_user)):
    addr = Address(**data.model_dump()).model_dump()
    addr["user_id"] = user["id"]
    if addr["is_default"]:
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    # if no default yet, make this default
    count = await db.addresses.count_documents({"user_id": user["id"]})
    if count == 0:
        addr["is_default"] = True
    await db.addresses.insert_one(addr)
    addr.pop("_id", None)
    return addr

@api.delete("/addresses/{addr_id}")
async def delete_address(addr_id: str, user: dict = Depends(get_current_user)):
    res = await db.addresses.delete_one({"id": addr_id, "user_id": user["id"]})
    return {"deleted": res.deleted_count}

@api.put("/addresses/{addr_id}/default")
async def set_default_address(addr_id: str, user: dict = Depends(get_current_user)):
    addr = await db.addresses.find_one({"id": addr_id, "user_id": user["id"]})
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.update_one({"id": addr_id, "user_id": user["id"]}, {"$set": {"is_default": True}})
    return {"ok": True}

# --- Orders / Payments ---
def compute_totals(items: List[OrderItem]):
    subtotal = sum(i.price * i.qty for i in items)
    delivery = 0 if subtotal >= 499 else 49
    total = round(subtotal + delivery, 2)
    return round(subtotal, 2), delivery, total

@api.post("/orders")
async def create_order(data: OrderCreate, user: dict = Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    address = await db.addresses.find_one({"id": data.address_id, "user_id": user["id"]}, {"_id": 0})
    if not address:
        raise HTTPException(status_code=400, detail="Address not found")
    subtotal, delivery, total = compute_totals(data.items)
    amount_paise = int(round(total * 100))
    if data.payment_method == "razorpay" and amount_paise < 100:
        raise HTTPException(status_code=400, detail="Order amount must be at least ₹1 for online payment")
    order_id = new_id()
    razorpay_order_id = None
    if data.payment_method == "razorpay":
        if RAZORPAY_MODE == "live" and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
            import razorpay
            from razorpay.errors import BadRequestError
            rz = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            try:
                rz_order = rz.order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order_id[:40],
                    "payment_capture": 1,
                })
            except BadRequestError as e:
                msg = str(e)
                if "auth" in msg.lower() or "key" in msg.lower():
                    raise HTTPException(status_code=401, detail="Razorpay authentication failed")
                raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {msg}")
            except Exception:
                raise HTTPException(status_code=500, detail="Razorpay order creation failed")
            razorpay_order_id = rz_order["id"]
        else:
            # Mock razorpay order id
            razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    doc = {
        "id": order_id,
        "user_id": user["id"],
        "user_mobile": user.get("mobile", ""),
        "items": [i.model_dump() for i in data.items],
        "address": address,
        "payment_method": data.payment_method,
        "payment_status": "pending",
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": None,
        "subtotal": subtotal,
        "delivery_fee": delivery,
        "total": total,
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.orders.insert_one(doc)
    return {
        "order": {k: v for k, v in doc.items() if k != "_id"},
        "razorpay_key_id": RAZORPAY_KEY_ID if RAZORPAY_MODE == "live" else "rzp_test_mock",
        "razorpay_mode": RAZORPAY_MODE,
    }

@api.post("/orders/verify")
async def verify_payment(data: PaymentVerify, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": data.order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    ok = True
    if RAZORPAY_MODE == "live" and RAZORPAY_KEY_SECRET:
        # verify signature
        message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), message.encode(), hashlib.sha256).hexdigest()
        ok = hmac.compare_digest(expected, data.razorpay_signature)
    if not ok:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    result = await db.orders.update_one(
        {"id": data.order_id, "payment_status": {"$ne": "paid"}},
        {"$set": {
            "payment_status": "paid",
            "status": "confirmed",
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
            "paid_at": now_iso(),
        }},
    )
    if result.modified_count:
        send_order_status_sms(order.get("user_mobile", ""), data.order_id, "confirmed")
    return {"ok": True}

@api.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: Optional[str] = Header(None)):
    body = await request.body()
    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not x_razorpay_signature or not hmac.compare_digest(expected, x_razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    payload = await request.json()
    event = payload.get("event")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    razorpay_order_id = entity.get("order_id")
    if not razorpay_order_id:
        return {"ok": True}
    if event == "payment.captured":
        updated = await db.orders.find_one_and_update(
            {"razorpay_order_id": razorpay_order_id, "payment_status": {"$ne": "paid"}},
            {"$set": {
                "payment_status": "paid",
                "status": "confirmed",
                "razorpay_payment_id": entity.get("id"),
                "paid_at": now_iso(),
            }},
        )
        if updated:
            send_order_status_sms(updated.get("user_mobile", ""), updated.get("id", ""), "confirmed")
    elif event == "payment.failed":
        await db.orders.update_one(
            {"razorpay_order_id": razorpay_order_id, "payment_status": {"$ne": "paid"}},
            {"$set": {"payment_status": "failed"}},
        )
    return {"ok": True}

@api.post("/orders/{order_id}/cod-confirm")
async def cod_confirm(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    result = await db.orders.update_one(
        {"id": order_id, "status": {"$ne": "confirmed"}},
        {"$set": {"status": "confirmed", "payment_status": "cod_pending"}},
    )
    if result.modified_count:
        send_order_status_sms(order.get("user_mobile", ""), order_id, "confirmed")
    return {"ok": True}

@api.get("/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"orders": docs}

@api.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc

# --- Admin ---
@api.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"orders": docs}

@api.put("/admin/orders/{order_id}/status")
async def admin_update_order(order_id: str, data: OrderStatusUpdate, admin: dict = Depends(get_admin)):
    allowed = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    updated = await db.orders.find_one_and_update(
        {"id": order_id, "status": {"$ne": data.status}},
        {"$set": {"status": data.status}},
    )
    if updated:
        send_order_status_sms(updated.get("user_mobile", ""), order_id, data.status)
    return {"ok": True}

@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin)):
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"payment_status": "paid"})
    pending = await db.orders.count_documents({"status": "pending"})
    users = await db.users.count_documents({})
    products = await db.products.count_documents({})
    # revenue
    pipeline = [{"$match": {"payment_status": {"$in": ["paid", "cod_pending"]}}},
                {"$group": {"_id": None, "revenue": {"$sum": "$total"}}}]
    rev_cursor = db.orders.aggregate(pipeline)
    revenue = 0
    async for r in rev_cursor:
        revenue = r.get("revenue", 0)
    return {"total_orders": total_orders, "paid_orders": paid_orders,
            "pending_orders": pending, "users": users, "products": products,
            "revenue": round(revenue, 2)}

# --- Health ---
@api.get("/")
async def root():
    return {"message": "Premium Oils API", "status": "ok"}

# Mount
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
