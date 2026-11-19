"""Users + Grams/Paras।"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_admin, get_current_user
from ..models import Gram, Para, Post, User
from ..schemas import GramCreate, GramOut, ParaCreate, ParaOut, PostOut, UserOut
from .helpers import post_to_out as _post_out

router = APIRouter(tags=["users", "grams"])


# ---------- Users ----------
@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/users/{username}", response_model=UserOut)
def get_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="ব্যবহারকারী পাওয়া যায়নি")
    return user


@router.get("/users/{user_id}/posts", response_model=list[PostOut])
def user_posts(user_id: int, status: str = "active", db: Session = Depends(get_db)):
    posts = (
        db.query(Post)
        .filter(Post.author_id == user_id, Post.status == status)
        .order_by(Post.created_at.desc())
        .all()
    )
    return [_post_out(p, db) for p in posts]


# ---------- Grams / Paras ----------
@router.get("/grams", response_model=list[GramOut])
def list_grams(db: Session = Depends(get_db)):
    return db.query(Gram).order_by(Gram.name).all()


@router.post("/grams", response_model=GramOut, status_code=201)
def create_gram(payload: GramCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if db.query(Gram).filter(Gram.name == payload.name).first():
        raise HTTPException(status_code=400, detail="এই গ্রামটি ইতিমধ্যে আছে")
    gram = Gram(name=payload.name)
    db.add(gram)
    db.commit()
    db.refresh(gram)
    return gram


@router.get("/grams/{gram_id}/paras", response_model=list[ParaOut])
def list_paras(gram_id: int, db: Session = Depends(get_db)):
    if not db.query(Gram).filter(Gram.id == gram_id).first():
        raise HTTPException(status_code=404, detail="গ্রাম পাওয়া যায়নি")
    return db.query(Para).filter(Para.gram_id == gram_id).order_by(Para.name).all()


@router.post("/grams/{gram_id}/paras", response_model=ParaOut, status_code=201)
def create_para(gram_id: int, payload: ParaCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if not db.query(Gram).filter(Gram.id == gram_id).first():
        raise HTTPException(status_code=404, detail="গ্রাম পাওয়া যায়নি")
    if db.query(Para).filter(Para.gram_id == gram_id, Para.name == payload.name).first():
        raise HTTPException(status_code=400, detail="এই পাড়াটি ইতিমধ্যে আছে")
    para = Para(gram_id=gram_id, name=payload.name)
    db.add(para)
    db.commit()
    db.refresh(para)
    return para


