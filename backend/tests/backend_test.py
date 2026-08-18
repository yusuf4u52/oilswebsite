"""Backend tests for Premium Oils API - covers products, auth (Google mock+admin), addresses, orders (razorpay mock + cod), admin CRUD."""
import json
import os
import random
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8000').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def google_email():
    return f"test.user.{random.randint(10000, 99999)}@example.com"


@pytest.fixture(scope="session")
def user_token(s, google_email):
    credential = json.dumps({"sub": google_email, "email": google_email, "name": "Test User"})
    r = s.post(f"{API}/auth/google", json={"credential": credential})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/admin/login", json={"email": "admin@yourstore.com", "password": "Admin@123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# -------- Health & Products --------
class TestHealthAndProducts:
    def test_health(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_list_products(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) == 4
        cats = [p["category"] for p in prods]
        assert cats.count("groundnut") == 2
        assert cats.count("coconut") == 1
        assert cats.count("almond") == 1

    def test_list_products_filter(self, s):
        r = s.get(f"{API}/products", params={"category": "coconut"})
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) == 1
        assert prods[0]["category"] == "coconut"

    def test_get_product_by_slug(self, s):
        # Fetch first groundnut slug
        r = s.get(f"{API}/products/cold-pressed-groundnut-oil")
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "cold-pressed-groundnut-oil"
        assert len(p["variants"]) >= 1
        assert len(p["highlights"]) >= 1

    def test_get_product_not_found(self, s):
        r = s.get(f"{API}/products/does-not-exist")
        assert r.status_code == 404


# -------- Google Sign-In (mock mode) --------
class TestGoogleAuth:
    def test_invalid_credential_json(self, s):
        r = s.post(f"{API}/auth/google", json={"credential": "not-json"})
        assert r.status_code == 400

    def test_credential_missing_identity(self, s):
        r = s.post(f"{API}/auth/google", json={"credential": json.dumps({"name": "No Id"})})
        assert r.status_code == 400

    def test_new_user_needs_mobile(self, s):
        email = f"needs.mobile.{random.randint(10000, 99999)}@example.com"
        credential = json.dumps({"sub": email, "email": email, "name": "New User"})
        r = s.post(f"{API}/auth/google", json={"credential": credential})
        assert r.status_code == 200, r.text
        j = r.json()
        assert "token" in j and "user" in j
        assert j["user"]["email"] == email
        assert j["needs_mobile"] is True

    def test_same_google_id_returns_same_account(self, s):
        email = f"repeat.login.{random.randint(10000, 99999)}@example.com"
        credential = json.dumps({"sub": email, "email": email, "name": "Repeat User"})
        r1 = s.post(f"{API}/auth/google", json={"credential": credential})
        r2 = s.post(f"{API}/auth/google", json={"credential": credential})
        assert r1.status_code == 200 and r2.status_code == 200
        assert r1.json()["user"]["id"] == r2.json()["user"]["id"]


# -------- Admin login --------
class TestAdminLogin:
    def test_admin_success(self, admin_token):
        assert admin_token

    def test_admin_wrong(self, s):
        r = s.post(f"{API}/auth/admin/login", json={"email": "admin@yourstore.com", "password": "bad"})
        assert r.status_code == 401


# -------- /auth/me --------
class TestMe:
    def test_me_no_token(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_me_user(self, s, user_token, google_email):
        r = s.get(f"{API}/auth/me", headers=auth(user_token))
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["email"] == google_email

    def test_me_admin(self, s, admin_token):
        r = s.get(f"{API}/auth/me", headers=auth(admin_token))
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_update_mobile_invalid(self, s, user_token):
        r = s.put(f"{API}/auth/me", json={"mobile": "123"}, headers=auth(user_token))
        assert r.status_code == 400

    def test_update_mobile_success(self, s, user_token):
        mobile = "97" + str(random.randint(10000000, 99999999))
        r = s.put(f"{API}/auth/me", json={"mobile": mobile}, headers=auth(user_token))
        assert r.status_code == 200, r.text
        assert r.json()["user"]["mobile"] == mobile
        r = s.get(f"{API}/auth/me", headers=auth(user_token))
        assert r.json()["user"]["mobile"] == mobile


# -------- Addresses --------
class TestAddresses:
    def test_create_and_list_and_delete(self, s, user_token):
        payload = {
            "name": "TEST User", "mobile": "9876543210",
            "line1": "12 Test Street", "line2": "Apt 1",
            "city": "Chennai", "state": "TN", "pincode": "600001",
            "landmark": "Near park", "is_default": False,
        }
        r = s.post(f"{API}/addresses", json=payload, headers=auth(user_token))
        assert r.status_code == 200, r.text
        addr = r.json()
        assert addr["is_default"] is True  # first becomes default
        aid = addr["id"]

        r = s.get(f"{API}/addresses", headers=auth(user_token))
        assert r.status_code == 200
        assert any(a["id"] == aid for a in r.json()["addresses"])

        r = s.delete(f"{API}/addresses/{aid}", headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["deleted"] == 1


# -------- Orders: Razorpay mock + COD + totals + Admin --------
class TestOrders:
    @pytest.fixture(scope="class")
    def addr_id(self, s, user_token):
        r = s.post(f"{API}/addresses", json={
            "name": "TEST", "mobile": "9876543210", "line1": "1 st",
            "city": "Chennai", "state": "TN", "pincode": "600001",
        }, headers=auth(user_token))
        assert r.status_code == 200
        return r.json()["id"]

    def _item(self, s, qty=1, price=520):
        r = s.get(f"{API}/products/cold-pressed-groundnut-oil")
        p = r.json()
        v = next(v for v in p["variants"] if v["price"] == price) if any(v["price"] == price for v in p["variants"]) else p["variants"][0]
        return {
            "product_id": p["id"], "variant_id": v["id"], "name": p["name"],
            "size": v["size"], "price": v["price"], "qty": qty,
            "image_url": p["image_url"],
        }

    def test_razorpay_mock_order_and_verify(self, s, user_token, addr_id):
        item = self._item(s, qty=1, price=520)
        r = s.post(f"{API}/orders", json={
            "items": [item], "address_id": addr_id, "payment_method": "razorpay",
        }, headers=auth(user_token))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["razorpay_mode"] == "mock"
        order = body["order"]
        assert order["razorpay_order_id"].startswith("order_mock_")
        # subtotal 520 >= 499 -> delivery 0
        assert order["delivery_fee"] == 0
        assert order["total"] == 520
        # verify mock
        rv = s.post(f"{API}/orders/verify", json={
            "order_id": order["id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": "pay_mock_123",
            "razorpay_signature": "sig_mock_any",
        }, headers=auth(user_token))
        assert rv.status_code == 200
        assert rv.json()["ok"] is True
        # confirm status
        r = s.get(f"{API}/orders/{order['id']}", headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"
        assert r.json()["payment_status"] == "paid"

    def test_cod_order_and_confirm(self, s, user_token, addr_id):
        item = self._item(s, qty=1, price=280)  # 280 < 499 -> delivery 49
        r = s.post(f"{API}/orders", json={
            "items": [item], "address_id": addr_id, "payment_method": "cod",
        }, headers=auth(user_token))
        assert r.status_code == 200
        order = r.json()["order"]
        assert order["delivery_fee"] == 49
        assert order["total"] == 329
        r = s.post(f"{API}/orders/{order['id']}/cod-confirm", headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["ok"] is True
        r = s.get(f"{API}/orders/{order['id']}", headers=auth(user_token))
        assert r.json()["status"] == "confirmed"

    def test_my_orders_list(self, s, user_token):
        r = s.get(f"{API}/orders", headers=auth(user_token))
        assert r.status_code == 200
        assert len(r.json()["orders"]) >= 1

    def test_admin_orders_and_status_update_and_stats(self, s, admin_token, user_token):
        r = s.get(f"{API}/admin/orders", headers=auth(admin_token))
        assert r.status_code == 200
        orders = r.json()["orders"]
        assert len(orders) >= 1
        oid = orders[0]["id"]
        r = s.put(f"{API}/admin/orders/{oid}/status", json={"status": "shipped"}, headers=auth(admin_token))
        assert r.status_code == 200
        r = s.get(f"{API}/admin/stats", headers=auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ("total_orders", "paid_orders", "pending_orders", "users", "products", "revenue"):
            assert k in d

    def test_admin_only_for_admin_endpoints(self, s, user_token):
        r = s.get(f"{API}/admin/orders", headers=auth(user_token))
        assert r.status_code == 403


# -------- Admin Product CRUD --------
class TestAdminProducts:
    def test_create_update_delete(self, s, admin_token):
        payload = {
            "slug": f"test-oil-{random.randint(10000,99999)}",
            "name": "TEST Oil", "category": "groundnut",
            "short_description": "test", "description": "test long",
            "image_url": "https://example.com/x.jpg", "gallery": [],
            "variants": [{"size": "1L", "price": 100.0, "mrp": 150.0, "stock": 10}],
            "highlights": ["A", "B"], "is_active": True,
        }
        r = s.post(f"{API}/admin/products", json=payload, headers=auth(admin_token))
        assert r.status_code == 200, r.text
        pid = r.json()["id"]

        payload["name"] = "TEST Oil Updated"
        r = s.put(f"{API}/admin/products/{pid}", json=payload, headers=auth(admin_token))
        assert r.status_code == 200
        assert r.json()["name"] == "TEST Oil Updated"

        r = s.delete(f"{API}/admin/products/{pid}", headers=auth(admin_token))
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

    def test_non_admin_forbidden(self, s, user_token):
        payload = {
            "slug": "no", "name": "no", "category": "groundnut",
            "short_description": "x", "description": "x", "image_url": "x",
            "variants": [{"size": "1L", "price": 1, "mrp": 1, "stock": 1}],
        }
        r = s.post(f"{API}/admin/products", json=payload, headers=auth(user_token))
        assert r.status_code == 403
