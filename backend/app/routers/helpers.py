"""রাউটারদের ভাগ করা হেল্পার।"""

from sqlalchemy.orm import Session

from ..models import Post, User
from ..schemas import PostOut


def post_to_out(post: Post, db: Session) -> PostOut:
    out = PostOut.model_validate(post)
    author = db.query(User).filter(User.id == post.author_id).first()
    out.author_username = author.username if author else None
    out.comment_count = len(post.comments)
    return out
