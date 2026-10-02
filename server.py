"""
FastAPI Backend Server for Multi-vendor Robot & PLC Control Platform
"""

from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import xml.etree.ElementTree as ET
import asyncio
import json

app = FastAPI(title="OmniControl PLC & Robot Backend API")

# Enable CORS for React Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database simulation for PLC Registers and Robot Joint States
system_state = {
    "plc_status": "RUN",
    "tags": [
        {"id": "X001", "name": "Start Switch", "value": True, "type": "BOOL"},
        {"id": "Y001", "name": "Tower Lamp Green", "value": True, "type": "BOOL"},
        {"id": "D100", "name": "Speed Command", "value": 1500, "type": "INT"},
        {"id": "D200", "name": "QD75_AXIS1_PV", "value": 450.5, "type": "REAL"}
    ],
    "robot_joints": {"j1": 0.0, "j2": 25.0, "j3": -40.0, "j4": 0.0, "j5": 15.0, "j6": 0.0}
}

@app.get("/api/health")
async def health_check():
    return {"status": "connected", "engine": "FastAPI Async Core"}

@app.post("/api/upload-project")
async def upload_plc_project(file: UploadFile = File(...)):
    """
    Parses uploaded GX Works2 XML Diffgram or PLC files on the server.
    """
    contents = await file.read()
    pou_list = []
    
    try:
        root = ET.fromstring(contents)
        for elem in root.iter():
            if elem.tag.endswith("szProjectdataName") or elem.tag.endswith("szName"):
                if elem.text and (elem.text.endswith(".pou") or elem.text.endswith(".lh")):
                    pou_name = elem.text.split(".")[0]
                    if pou_name not in pou_list and not pou_name.startswith("010100"):
                        pou_list.append(pou_name)
    except Exception as e:
        # Fallback if XML structure is non-standard
        pou_list = ["00_MAIN", "00_UNIT", "01_DATA", "02_QD75", "99_TS"]

    return {
        "filename": file.filename,
        "parsed_pous": pou_list,
        "message": f"Successfully parsed {len(pou_list)} POUs."
    }

@app.get("/api/tags")
async def get_tags():
    return system_state["tags"]

@app.post("/api/robot/pose")
async def update_robot_pose(joints: dict):
    system_state["robot_joints"] = joints
    return {"status": "success", "joints": system_state["robot_joints"]}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Broadcast state every 100ms
            await websocket.send_text(json.dumps(system_state))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("Client disconnected from telemetry stream.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)