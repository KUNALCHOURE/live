import React, { useEffect, useRef, useState } from "react";
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import { io } from "socket.io-client";
import '../styles/videomeetstyle.css'
const server_url="http://localhost:3000";
var connections={};

const peerconfigconnnections={
  "iceServers":[
    {"urls":"stun:stun.l.google.com:19302"}
  ] 
}

export default function Videomeetcomponent(){

  var socketRef=useRef();
  let socketIdRef=useRef();
  let localVideoRef=useRef();
  const videoRef = useRef([]);

  let [videoAvailable,setVideoAvailable]=useState(true);
  let[audioAvailabel,setaudioavailable]=useState(true);

  let[video,setVideo]=useState([]);
  let[audio,setAudio]=useState();
  let[screen,setscreen]=useState();

  let[showmodel,setmodel]=useState();
  let[screenAvailable,setscreenAvailable]=useState();

  let[messages,setmessages]=useState([]);
  let[message,setmessage]=useState([]);
  let[newMessages,setnewMessages]=useState(0);

  let[askforusername,setaskforusername]=useState(true);
  let[username,setusername]=useState("");

  let[videos,setvideos]=useState([]);

  const getpermission=async()=>{
    try {
      const videopermission=navigator.mediaDevices.getUserMedia({video:true})
      if(videopermission){
        setVideoAvailable(true);
      }
      else{
        setVideoAvailable(false)
      }
      const audiopermission=navigator.mediaDevices.getUserMedia({ audio:true})
      if(audiopermission){
        setaudioavailable(true);
      }
      else{
        setaudioavailable(false)
      }
      if(navigator.mediaDevices.getDisplayMedia){
        setscreenAvailable(true);
      }
      else{
        setscreenAvailable(false);
      }

      if(videoAvailable || audioAvailabel){
        const usermediaStream=await navigator.mediaDevices.getUserMedia({video:videoAvailable,audio:audioAvailabel});
        if(usermediaStream){
          window.localStream=usermediaStream;
          if(localVideoRef.current){
            localVideoRef.current.srcObject=usermediaStream;
          }
        }
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  let getUserMediasucces=(stream)=>{
    try{
      window.localStream.getTracks().forEach(track=>track.stop())
    }
    catch(e){console.log(e)}

    window.localStream=stream;
    localVideoRef.current.srcObject=stream;
    
    for(let id in connections){
      if(id===socketIdRef.current) continue;
      
      connections[id].addStream(window.localStream)
      connections[id].createOffer().then((description)=>{
        connections[id].setLocalDescription(description)
        .then(()=>{
          socketRef.current.emit('signal', id, JSON.stringify({ "sdp": connections[id].localDescription }))
        })
        .catch(e=>console.log(e));
      })
    }

    stream.getTracks().forEach(track=>track.onended=()=>{
      setVideo(false)
      setAudio(false);
      try {
        let tracks=localVideoRef.current.srcObject.getTracks()
        tracks.forEach(track=> track.stop())
      } catch (error) {
        console.log(error);
      }

      for(let id in connections){
        connections[id].addStream(window.localStream)
        connections[id].createOffer().then((description)=>{
          connections[id].setLocalDescription(description)
          .then(()=>{
            socketRef.current.emit("signal",id,JSON.stringify({"sdp":connections[id].localDescription}))
          })
          .catch(e=>console.log(e));
        })
      }

      let blacksilence=(...args)=>new MediaStream([black(...args),silence()]);
      window.localStream=blacksilence();
      localVideoRef.current.srcObject=window.localStream;
    })
  }

  let silence = ()=>{
    let ctx=new AudioContext()
    let oscillator=ctx.createOscillator();

    let dst=oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0],{enabled:false});
  }

  let black=({width=640 ,height=480 }={})=>{
    let canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').fillRect(0,0,width,height);
    let stream=canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0],{enabled:false})
  }

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailabel)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediasucces)
        .catch((e) => console.log("Error accessing media devices:", e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {
        console.log("Error stopping media tracks:", error);
      }
    }
  };

  let connect=()=>{
    setaskforusername(false);
    getmedia();
  }

  useEffect(()=>{
    if(video!==undefined && audio!==undefined){
      getUserMedia()
    }
  },[audio,video])

  useEffect(()=>{
    getpermission();
  },[])

  let getmedia=()=>{
    setVideo(videoAvailable);
    setAudio(audioAvailabel);
    ConnectToSocketServer();
  }

  let getmessagefromserver=(fromId,message)=>{
    var signal =JSON.parse(message)

    if(fromId!==socketIdRef.current ){
      if(signal.sdp){
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(()=>{
          if(signal.sdp.type==='offer'){
            connections[fromId].createAnswer().then((description)=>{
              connections[fromId].setLocalDescription(description)
              .then(()=>{
                socketRef.current.emit('signal',fromId,JSON.stringify({"sdp":connections[fromId].localDescription}))
              }).catch(e=>console.log(e))
            }).catch(e=>console.log(e))
          }
        }).catch(e=>console.log(e))
      }
      if(signal.ice){
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
      }
    }
  }
  let addmessage=()=>{}

  let  ConnectToSocketServer=()=>{
    socketRef.current=io.connect(server_url,{secure:false})
    socketRef.current.on('signal',getmessagefromserver);
    socketRef.current.on('connect',()=>{
      {console.log("user is joined and this is the connection message ")}
      socketRef.current.emit('join-call',window.location.href)
      socketIdRef.current=socketRef.current.id;
      socketRef.current.on('chat-message',addmessage)
      socketRef.current.on('user-left', (id) => {
        console.log('videos before filter:', videos);
        setvideos((prevVideos) => {
          const updatedVideos = prevVideos.filter((video) => video.socketId !== id);
          return updatedVideos;
        });
      });

      socketRef.current.on('user-joined',(id,clients)=>{
        clients.forEach((socketListId)=>{
          connections[socketListId] = new RTCPeerConnection(peerconfigconnnections);
          connections[socketListId].onicecandidate=(event)=>{
            if(event.candidate!==null){
              socketRef.current.emit('signal',socketListId,JSON.stringify({'ice':event.candidate}))
            }
          }
          connections[socketListId].onaddstream=(event)=>{
            let videoExists=videoRef.current.find(video=>video.socketId===socketListId);
            if (videoExists) {
              setvideos((videos) => {
                  const updatedVideos = videos.map((video) =>
                      video.socketId === socketListId
                          ? { ...video, stream: event.stream }
                          : video
                  );
                  videoRef.current = updatedVideos;
                  return updatedVideos;
              });
            } else {
              let newvideo={
                socketId:socketListId,
                stream:event.stream,
                autoplay:true,
                playinline:true
              }
              setvideos(videos=>{
                const updatedVideos=[...videos,newvideo];
                videoRef.current=updatedVideos;
                return updatedVideos;
              })
            }
          };
          if(window.localStream!==undefined && window.localStream!==null){
            connections[socketListId].addStream(window.localStream);
          } else {
            let blacksilence=(...args)=>new MediaStream([black(...args),silence()]);
            window.localStream=blacksilence();
            connections[socketListId].addStream(window.localStream);
          }
        })
        if(id===socketIdRef.current){
          for(let id2 in connections){
            if(id2=== socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream)
            } catch (error) {
              console.log(error);
            }
            connections[id2].createOffer().then((description)=>{
              connections[id2].setLocalDescription(description)
              .then(()=>{
                socketRef.current.emit('signal',id2,JSON.stringify({'sdp':connections[id2].localDescription}))
              })
              .catch(e=>console.log(e))
            })
          }
        }
      })
    })
  }

  return(
  
      <div className="meetjoining">
        
      {askforusername===true?
      <div className="lobbyoptions">
        <div className="lobbycontent" style={{margin:'17px'}}>
        <h2 style={{textAlign:'center'}}>Enter into lobby </h2>
       
        <TextField id="outlined-basic" label="Username" variant="outlined" value={username} onChange={(e)=>setusername(e.target.value)} />

        <Button variant="contained"onClick={connect} >Connect </Button>
        </div>
        <div className="localvideo">
          <video ref={localVideoRef} autoPlay muted></video>
        </div>
      </div>
      :
      <>
        <video ref={localVideoRef} autoPlay muted></video>
        {videos.map((video, index) => (
          <div key={video.socketId}>
            <h2>{video.socketId}</h2>
            {console.log(`Stream for ${video.socketId}:`, video.stream)}
            {video.stream ? (
              <video
                data-socket={video.socketId}
                ref={(ref) => {
                  if (ref && ref.srcObject !== video.stream) {
                    ref.srcObject = video.stream;
                  }
                }}
                autoPlay
                playsInline
                muted
              ></video>
            ) : (
              <p>Waiting for stream...</p>
            )}
          </div>
        ))}
      </>
      }
      
      </div> 
   
  )
}