/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useUpProvider } from "./lukso/UPProvider";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { getNextCanvasId, mintCanvasSc } from "./web3/interactions";
import axios from "axios";

const SERVER_URL = "https://murmuring-hamlet-29765-419f246586af.herokuapp.com"; // Replace with your deployed server URL

export default function Home() {
  const { accounts, chainId, client } = useUpProvider();
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [sessionCode, setSessionCode] = useState(() => {
    return localStorage.getItem("sessionCode") || "";
  });
  const [connected, setConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(() => {
    return localStorage.getItem("sessionStarted") === "true" || false;
  });
  const canvasRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const prevPositionRef = useRef({ x: 0, y: 0 });
  const isNewStrokeRef = useRef(true);

  const emitDraw = useRef(
    (
      data: any,
      sessionStarted: any,
      connected: any,
      socket: { emit: (arg0: string, arg1: any) => void }
    ) => {
      console.log(sessionStarted, connected, "lol2");
      if (sessionStarted && connected) {
        console.log("Emitting draw event:", data);
        socket.emit("draw", data);
      } else {
        console.warn(
          "Not emitting draw event: sessionStarted or connected is false",
          {
            sessionStarted,
            connected,
          }
        );
      }
    }
  ).current;

  // Log component lifecycle
  useEffect(() => {
    console.log("Home component mounted");
    return () => {
      console.log("Home component unmounted");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Log state changes
  useEffect(() => {
    console.log("sessionStarted changed:", sessionStarted);
    localStorage.setItem("sessionStarted", sessionStarted.toString());
  }, [sessionStarted]);

  useEffect(() => {
    console.log("connected changed:", connected);
  }, [connected]);

  useEffect(() => {
    localStorage.setItem("sessionCode", sessionCode);
  }, [sessionCode]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas!.width = window.innerWidth;
        canvas!.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    if (sessionStarted) {
      if (!socketRef.current) {
        console.log("Connecting to server with session code:", sessionCode);
        socketRef.current = io(SERVER_URL, {
          query: { sessionCode, walletAddress: accounts[0] },
        });

        socketRef.current.on("connect", () => {
          setConnected(true);
          console.log("Connected to server");
        });

        socketRef.current.on("connect_error", (error: any) => {
          console.error("Connection error:", error);
          setConnected(false);
          toast.error(
            "Failed to connect to the server. Please try again later."
          );
          setSessionStarted(false);
        });

        socketRef.current.on("userJoined", (addr: any) => {
          console.log(`${addr} joined`);
        });

        socketRef.current.on("userLeft", (addr: any) => {
          console.log(`${addr} left`);
        });

        socketRef.current.on(
          "draw",
          (data: {
            isNewStroke: any;
            startX: any;
            startY: any;
            endX: any;
            endY: any;
            color: any;
          }) => {
            console.log("Received draw event:", data);
            const canvas = canvasRef.current;
            if (!canvas) {
              console.error("Canvas not found");
              return;
            }
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              console.error("Canvas context not found");
              return;
            }

            if (data.isNewStroke) {
              ctx.beginPath();
              ctx.moveTo(data.startX, data.startY);
            } else {
              ctx.moveTo(data.startX, data.startY);
            }

            ctx.lineTo(data.endX, data.endY);
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.stroke();
          }
        );

        socketRef.current.on("clear", () => {
          console.log("Received clear event");
          const canvas = canvasRef.current;
          if (!canvas) {
            console.error("Canvas not found");
            return;
          }
          // Force resize to ensure dimensions are correct
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.error("Canvas context not found");
            return;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Force repaint by toggling a CSS property
          canvas.style.opacity = "0.99";
          setTimeout(() => {
            canvas.style.opacity = "1";
          }, 0);
        });
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [sessionStarted, sessionCode]);

  const startDrawing = (e: any) => {
    if (!sessionStarted || !connected) {
      console.log("Cannot start drawing: session not started or not connected");
      toast.error("Please join a session before drawing.");
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    prevPositionRef.current = { x, y };
    isNewStrokeRef.current = true;
    setDrawing(true);
  };

  const draw = (e: any) => {
    if (!drawing || !sessionStarted || !connected) {
      console.log(
        "Cannot draw: not drawing, session not started, or not connected"
      );
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const currentX = e.nativeEvent.offsetX;
    const currentY = e.nativeEvent.offsetY;

    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();

    emitDraw(
      {
        startX: prevPositionRef.current.x,
        startY: prevPositionRef.current.y,
        endX: currentX,
        endY: currentY,
        color: color,
        isNewStroke: isNewStrokeRef.current,
      },
      sessionStarted,
      connected,
      socketRef.current
    );

    prevPositionRef.current = { x: currentX, y: currentY };
    isNewStrokeRef.current = false;
  };

  const stopDrawing = () => {
    setDrawing(false);
    isNewStrokeRef.current = true;
  };

  const handleStartSession = () => {
    if (!sessionCode) {
      toast.error("Please enter a session code.");
      return;
    }
    console.log("Joining session with code:", sessionCode);
    setSessionStarted(true);
  };

  const generateSessionCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(newCode);
    navigator.clipboard
      .writeText(newCode)
      .then(() => toast.error(`Copied session code: ${newCode}`));
  };

  const leaveSession = () => {
    setSessionStarted(false);
    setConnected(false);
    setSessionCode("");
    localStorage.removeItem("sessionStarted");
    localStorage.removeItem("sessionCode");
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const clearCanvas = () => {
    console.log("Clearing canvas");
    const canvas = canvasRef.current;
    if (canvas) {
      // Force resize to ensure dimensions are correct
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Force repaint
      canvas.style.opacity = "0.99";
      setTimeout(() => {
        canvas.style.opacity = "1";
      }, 0);
    }
    if (socketRef.current) {
      socketRef.current.emit("clear");
    }
  };

  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
  const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
  
  const uploadToPinata = async (file: File, id: number): Promise<string> => {
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pinataMetadata", JSON.stringify({ name: `canvas-${id}.png` }));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET, // Fixed the header name
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload to Pinata");
      }

      console.log("Pinata upload successful:", data);
      return data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw error;
    }
  };

  const fileToKeccak256 = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const hash = ethers.keccak256(uint8Array);
      return hash;
    } catch (error) {
      console.error("Error computing Keccak256 hash:", error);
      throw error;
    }
  };

  const mintCanvas = async () => {
    if (!sessionStarted || !connected) {
      toast.error("Please join a session before minting.");
      return;
    }
    if (!accounts[0]) {
      toast.error("Please connect your wallet to proceed with minting.");
      return;
    }
    socketRef.current.emit(
      "mint",
      { data: "mint request" },
      async (response: any) => {
        if (response.walletAddresses && response.walletAddresses.length > 1) {
          const canvas = canvasRef.current;
          if (!canvas) {
            toast.error("Canvas not found, cannot capture image.");
            return;
          }

          const nextCanvasId = await getNextCanvasId(chainId);

          // Capture the canvas image as a data URL
          const imageDataUrl = canvas.toDataURL("image/png");

          try {
            // Convert the data URL to a File object
            const file = dataURLtoFile(
              imageDataUrl,
              `canvas-${nextCanvasId}.png`
            );

            const keccakHash = await fileToKeccak256(file);
            // Upload the file to Pinata
            const ipfsHash = await uploadToPinata(file, nextCanvasId);

            const json = {
              LSP4Metadata: {
                name: "Canvas",
                description: `Created by ${response.walletAddresses[0]} and ${
                  response.walletAddresses[1] ?? "/"
                }`,
                links: [
                  {
                    title: "Twitter",
                    url: "https://x.com/Kolleger4",
                  },
                ],
                icon: [
                  {
                    width: 1280,
                    height: 720,
                    url: `ipfs://${ipfsHash}`,
                    verification: {
                      method: "keccak256(bytes)",
                      data: keccakHash,
                    },
                  },
                ],
                images: [
                  [
                    {
                      width: 1280,
                      height: 720,
                      url: `ipfs://${ipfsHash}`,
                      verification: {
                        method: "keccak256(bytes)",
                        data: keccakHash,
                      },
                    },
                  ],
                ],
                assets: [],
                attributes: [],
              },
            };

            const body = {
              pinataMetadata: {
                name: `canvas-${nextCanvasId}`,
              },
              pinataContent: json,
            };


            const res = await axios.post(
              "https://api.pinata.cloud/pinning/pinJSONToIPFS",
              body,
              {
                headers: {
                  "Content-Type": "application/json",
                  pinata_api_key: PINATA_API_KEY,
                  pinata_secret_api_key: PINATA_API_SECRET,
                },
              }
            );

            const ipfsUrl = `ipfs://${res.data.IpfsHash}`;

            
            await mintCanvasSc(chainId, json, ipfsUrl, client, accounts[0], response.walletAddresses[0], response.walletAddresses[1] ?? response.walletAddresses[0])
          } catch (error) {
            toast.error("Failed to upload canvas image to Pinata.");
            console.error(error);
          }

          return;
        }

        toast.error("Error occurred");
        return;
      }
    );
  };
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-10 flex flex-col items-center p-4 space-y-3">
        {!sessionStarted && (
          <div className="bg-white bg-opacity-90 rounded p-3 shadow w-full max-w-3xl flex items-center space-x-2">
            <button
              onClick={() => {
                console.log("Generate & Copy button clicked");
                generateSessionCode();
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 cursor-pointer"
            >
              Generate & Copy
            </button>
            <input
              type="text"
              placeholder="Enter or Paste Code"
              value={sessionCode}
              onChange={(e) => {
                console.log("Session code input changed:", e.target.value);
                setSessionCode(e.target.value.toUpperCase());
              }}
              className="border p-2 rounded flex-grow"
            />
            <button
              onClick={() => {
                console.log("Join Session button clicked");
                handleStartSession();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
            >
              Join Session
            </button>
          </div>
        )}

        {sessionStarted && !connected && (
          <div className="text-yellow-700 bg-white bg-opacity-80 px-4 py-1 rounded shadow">
            Connecting to session <strong>{sessionCode}</strong>...
          </div>
        )}

        {sessionStarted && connected && (
          <div className="flex items-center space-x-2">
            <div className="text-green-700 bg-white bg-opacity-80 px-4 py-1 rounded shadow">
              Connected to <strong>{sessionCode}</strong>
            </div>
            <button
              onClick={() => {
                console.log("Leave Session button clicked");
                leaveSession();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 cursor-pointer"
            >
              Leave Session
            </button>
          </div>
        )}

        <div className="flex space-x-2 bg-white bg-opacity-80 p-2 rounded shadow">
          {["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00"].map((c) => (
            <button
              key={c}
              className="w-8 h-8 rounded-full border-2 border-gray-400 cursor-pointer"
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          {sessionStarted && connected && (
            <button
              onClick={() => {
                console.log("Clear Canvas button clicked");
                clearCanvas();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 cursor-pointer"
            >
              Clear Canvas
            </button>
          )}

          <button
            onClick={() => {
              mintCanvas();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer"
          >
            Mint Canvas
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
        style={{
          cursor: sessionStarted && connected ? "crosshair" : "not-allowed",
        }}
        onMouseDown={(e) => {
          if (e.target === canvasRef.current) startDrawing(e);
        }}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
