import React, { useEffect, useRef, useState } from "react";
import { Button, TextField } from "@mui/material";
import { io } from "socket.io-client";
import VideoMeeting from "./meet";

const server_url = "http://localhost:3000";
var connections = {};

const peerconfigconnnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  const videoRef = useRef([]);

  const [askforusername, setaskforusername] = useState(true);
  const [username, setusername] = useState("");
  const [videos, setvideos] = useState([]);

  // Connect to socket server and handle user join events
  let ConnectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", getmessagefromserver);
    socketRef.current.on("connect", () => {
      console.log("User joined, establishing connection...");
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("user-left", (id) => {
        setvideos((prevVideos) => prevVideos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(peerconfigconnnections);
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
            }
          };
          connections[socketListId].onaddstream = (event) => {
            let newvideo = {
              socketId: socketListId,
              stream: event.stream,
              autoplay: true,
              playsInline: true,
            };
            setvideos((prevVideos) => [...prevVideos, newvideo]);
          };
        });
      });
    });
  };

  // Handle WebRTC signaling messages from the server
  let getmessagefromserver = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === "offer") {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
              });
            });
          }
        });
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
      }
    }
  };

  // Request user media permissions and show video preview
  const getUserMedia = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (userStream) {
        window.localStream = userStream;
        localVideoRef.current.srcObject = userStream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  useEffect(() => {
    getUserMedia();
  }, []);

  let connect = (e) => {
    e.preventDefault();
    setaskforusername(false);
    ConnectToSocketServer();
  };

  return (
    <>
      {askforusername ? (
          <div className="flex flex-col items-center justify-around min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 p-4 lg:flex-row">
          <div className="bg-gray-900 shadow-lg rounded-xl p-6 w-full max-w-md text-white border border-gray-700 transform transition duration-300 hover:scale-105">
      <form onSubmit={connect} className="flex flex-col space-y-5">
        <h2 className="text-3xl font-extrabold text-center text-orange-400">Enter into Lobby</h2>
        <TextField
          required
          id="outlined-basic"
          variant="outlined"
          value={username}
          onChange={(e) => setusername(e.target.value)}
          className="w-full bg-white text-black rounded-lg border border-gray-600 focus:border-orange-500 shadow-sm"
          placeholder="username"
        />
        <Button 
          variant="contained" 
          type="submit" 
          className="w-full bg-orange-500  text-white py-3 rounded-lg shadow-md text-lg font-bold">
          Connect
        </Button>
      </form>
    </div>
          <div className="mt-6 w-full max-w-md">
            <video ref={localVideoRef} autoPlay muted className="w-full rounded-lg shadow-md border-2 border-gray-700"></video>
          </div>
        </div>
      )
    
    :
    <VideoMeeting/>}
    </>
  );
}
