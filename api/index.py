"""Vercel entry point: serves the Django API as a Python serverless function."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("DJANGO_DEBUG", "false")
# Only /tmp is writable on Vercel; the cache lives as long as the function instance.
os.environ.setdefault("CACHE_DIR", "/tmp/windcast-cache")

from config.wsgi import application  # noqa: E402

app = application
