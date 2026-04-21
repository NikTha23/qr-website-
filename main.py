from flask import Flask, request, jsonify, redirect, send_file, abort
from flask_cors import CORS
from pydantic import BaseModel, HttpUrl, ValidationError
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from datetime import datetime
import qrcode
import os
import secrets

# -------------------------
# Database Setup (SQLite for now)
# -------------------------
DATABASE_URL = "sqlite:///./qr_app.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    target_url = Column(String)
    scan_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


# -------------------------
# Request validation
# -------------------------
class EventCreate(BaseModel):
    name: str
    target_url: HttpUrl


def event_to_dict(e: Event) -> dict:
    return {
        "id": e.id,
        "code": e.code,
        "name": e.name,
        "target_url": e.target_url,
        "scan_count": e.scan_count,
    }


# -------------------------
# App Setup
# -------------------------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
# Use qrcodes/ (not qr/) so we do not clash if static/qr exists as a file on disk
QR_DIR = os.path.join(STATIC_DIR, "qrcodes")
os.makedirs(QR_DIR, exist_ok=True)

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")
CORS(app, resources={r"/*": {"origins": "*"}})


def get_db() -> Session:
    return SessionLocal()


def generate_unique_code(db: Session) -> str:
    while True:
        code = secrets.token_urlsafe(4)
        if not db.query(Event).filter_by(code=code).first():
            return code


def generate_qr(url: str, code: str):
    img = qrcode.make(url)
    file_path = os.path.join(QR_DIR, f"{code}.png")
    img.save(file_path)
    return file_path


# -------------------------
# API Routes
# -------------------------
@app.post("/api/events")
def create_event():
    db = get_db()
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"detail": "Invalid JSON"}), 400
        try:
            event_in = EventCreate(**data)
        except ValidationError as e:
            return jsonify({"detail": e.errors()}), 422

        code = generate_unique_code(db)
        base = request.url_root.rstrip("/")
        visit_url = f"{base}/q/{code}"

        db_event = Event(
            code=code,
            name=event_in.name,
            target_url=str(event_in.target_url),
            scan_count=0,
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)

        generate_qr(visit_url, code)

        return jsonify(event_to_dict(db_event))
    finally:
        db.close()


@app.get("/api/events")
def list_events():
    db = get_db()
    try:
        events = db.query(Event).order_by(Event.created_at.desc()).all()
        return jsonify([event_to_dict(e) for e in events])
    finally:
        db.close()


@app.get("/q/<code>")
def handle_scan(code: str):
    db = get_db()
    try:
        event = db.query(Event).filter_by(code=code).first()
        if not event:
            abort(404, description="Invalid QR Code")
        event.scan_count += 1
        db.commit()
        return redirect(event.target_url, code=302)
    finally:
        db.close()


@app.get("/")
def read_root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    return send_file(index_path)


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
