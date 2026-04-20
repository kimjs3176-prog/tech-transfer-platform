import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from mangum import Mangum
from backend.app.main import app

# Vercel 서버리스 핸들러
handler = Mangum(app, lifespan="off")
