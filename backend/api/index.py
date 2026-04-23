import sys
from pathlib import Path

# backend/ 디렉토리를 Python 경로에 추가 (experimentalServices 기준)
sys.path.insert(0, str(Path(__file__).parent.parent))

from mangum import Mangum
from app.main import app

# lifespan="auto": startup 이벤트(create_all) 실행 허용
handler = Mangum(app, lifespan="auto")
