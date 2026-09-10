from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

websocket_router = APIRouter()
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active:
            self.active[user_id] = set()
        self.active[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active:
            self.active[user_id].discard(websocket)

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active:
            for ws in self.active[user_id]:
                await ws.send_json(message)

    async def broadcast(self, message: dict):
        for connections in self.active.values():
            for ws in connections:
                await ws.send_json(message)


manager = ConnectionManager()


@websocket_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
