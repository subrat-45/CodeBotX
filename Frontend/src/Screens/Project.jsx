import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "../Config/axios.js";
import { initializeSocket, dataReceive, dataSend } from "../Config/socket.js";
import UserContext from "../Context/userContext.jsx";
import Markdown from "markdown-to-jsx";
import Typewriter from "typewriter-effect";
import Editor from "@monaco-editor/react";

const Project = () => {
  const location = useLocation();
  const project = Array.isArray(location.state)
    ? location.state[0]
    : location.state;

  const [sidePannelOpen, setsidePannelOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [projectData, setProjectData] = useState(project);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [aiTyping, setAiTyping] = useState(false);
  const { user } = useContext(UserContext);
  const bottomRef = useRef(null);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  
  // Mobile state
  const [mobileView, setMobileView] = useState("chat"); // "chat" or "code"
  const [mobileFilesOpen, setMobileFilesOpen] = useState(false);

  const handleUserSelect = (userId) => {
    setSelectedUserIds((prev) => {
      const newSelectedId = new Set(prev);
      if (newSelectedId.has(userId)) {
        newSelectedId.delete(userId);
      } else {
        newSelectedId.add(userId);
      }
      return Array.from(newSelectedId);
    });
  };

  const fetchUsers = () => {
    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        console.log(err.message);
        setUsers([]);
      });
  };

  const fetchCollaborators = () => {
    axios
      .get(`/projects/get-project/${projectData._id}`)
      .then((res) => {
        setCollaborators(res.data.project.users || []);
      })
      .catch((err) => {
        console.log(err.message);
        setCollaborators([]);
      });
  };

  const addCollaborators = () => {
    axios
      .put("/projects/add-user", {
        projectId: projectData._id,
        users: Array.from(selectedUserIds),
      })
      .then((res) => {
        setCollaborators(res.data.users || []);
        setUserModalOpen(false);
        setSelectedUserIds([]);
        fetchUsers();
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const msgObj = {
      message,
      sender: { _id: user._id, email: user.email },
      type: "user",
    };
    dataSend("project-message", msgObj);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  useEffect(() => {
    initializeSocket(projectData._id);

    dataReceive("ai-typing", (data) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setAiTyping(parsed.isTyping);
    });

    dataReceive("project-message", (data) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;

      if (parsed.type === "ai" || parsed.sender?._id === "ai") {
        const aiMessage = parsed.message;

        if (aiMessage.fileTree) {
          setFileTree(aiMessage.fileTree);
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: { _id: "ai", email: "AI Assistant" },
            message: aiMessage,
            type: "ai",
          },
        ]);
      } else if (parsed.type === "user") {
        setMessages((prev) => [
          ...prev,
          {
            sender: parsed.sender,
            message: parsed.message,
            type: "user",
          },
        ]);
      }
    });

    fetchUsers();
    fetchCollaborators();
  }, [projectData._id]);

  useEffect(() => {
    if (userModalOpen) {
      fetchUsers();
    }
  }, [userModalOpen]);

  const getInitials = (email) => {
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const renderAIMessage = (msg) => {
    const aiData = msg.message;
    const hasCode = aiData.fileTree && Object.keys(aiData.fileTree).length > 0;

    return (
      <div className="w-full">
        <div className="px-4 md:px-5 py-3 md:py-4 rounded-2xl shadow-xl bg-gradient-to-br from-purple-900/40 via-slate-900/40 to-black/40 border border-purple-500/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <i className="ri-robot-2-fill text-white text-xs md:text-sm" />
            </div>
            <span className="font-semibold text-purple-300 text-xs md:text-sm">
              AI Assistant
            </span>
          </div>

          {aiData.text && (
            <div className="text-gray-200 text-xs md:text-sm leading-relaxed mb-3 pl-8 md:pl-9">
              <Typewriter
                onInit={(tw) => {
                  tw.typeString(aiData.text).start();
                }}
                options={{
                  delay: 15,
                  cursor: "",
                }}
              />
            </div>
          )}

          {hasCode && (
            <div className="mt-3 pl-8 md:pl-9">
              <div className="flex items-center gap-2 text-green-400 text-xs md:text-sm">
                <i className="ri-check-double-line" />
                <span>
                  Generated {Object.keys(aiData.fileTree).length} file(s)
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.keys(aiData.fileTree).map((fileName) => (
                  <span
                    key={fileName}
                    className="px-2 md:px-3 py-1 bg-gray-800/60 rounded-lg text-xs text-yellow-400 font-mono border border-gray-700/50"
                  >
                    📄 {fileName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(aiData.buildCommand || aiData.startCommand) && (
            <div className="mt-3 pl-8 md:pl-9 space-y-2">
              {aiData.buildCommand && aiData.buildCommand.commands && (
                <div className="flex items-center gap-2 text-blue-400 text-xs font-mono">
                  <i className="ri-tools-line" />
                  <code className="bg-gray-900/60 px-2 py-1 rounded border border-gray-700/50 break-all">
                    {aiData.buildCommand.mainItem}{" "}
                    {Array.isArray(aiData.buildCommand.commands)
                      ? aiData.buildCommand.commands.join(" ")
                      : aiData.buildCommand.commands}
                  </code>
                </div>
              )}
              {aiData.startCommand && aiData.startCommand.commands && (
                <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
                  <i className="ri-play-line" />
                  <code className="bg-gray-900/60 px-2 py-1 rounded border border-gray-700/50 break-all">
                    {aiData.startCommand.mainItem}{" "}
                    {Array.isArray(aiData.startCommand.commands)
                      ? aiData.startCommand.commands.join(" ")
                      : aiData.startCommand.commands}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <main className="h-screen w-screen flex flex-col md:flex-row bg-gray-900 text-white fixed overflow-hidden">
        {/* Chat Section - Full screen on mobile, left panel on desktop */}
        <section className={`${
          mobileView === "chat" ? "flex" : "hidden md:flex"
        } h-full w-full md:w-[36rem] bg-gradient-to-b from-gray-800 to-gray-900 flex-col border-r border-gray-700/50`}>
          <header className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
                <i className="ri-code-s-slash-line text-white text-lg md:text-xl" />
              </div>
              <div>
                <h1 className="text-xs md:text-sm font-bold text-white truncate max-w-[150px] md:max-w-none">
                  {projectData.name || "Project"}
                </h1>
                <p className="text-xs text-gray-400">
                  {collaborators.length} collaborators
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg bg-purple-600/20 hover:bg-purple-600/30 cursor-pointer transition-all duration-200 border border-purple-500/30"
                onClick={() => setUserModalOpen(true)}
                title="Add Collaborators"
              >
                <i className="ri-user-add-line text-purple-400 text-base md:text-lg" />
              </button>
              <button
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg bg-purple-600/20 hover:bg-purple-600/30 cursor-pointer transition-all duration-200 border border-purple-500/30"
                onClick={() => setsidePannelOpen((prev) => !prev)}
                title="View Collaborators"
              >
                <i className="ri-group-line text-purple-400 text-base md:text-lg" />
              </button>
            </div>
          </header>

          <div className="chatArea relative flex flex-col flex-1 overflow-hidden">
            <div className="scroll message-box flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 md:px-6 space-y-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                    <i className="ri-chat-3-line text-2xl md:text-3xl text-purple-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-300">
                    No messages yet
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">
                    Start the conversation by sending a message
                  </p>
                  <p className="text-xs text-purple-400 bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-500/30">
                    💡 Use <span className="font-mono font-bold">@ai</span> to
                    ask AI for help
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isUser = msg.sender._id === user._id;
                  const isAI = msg.sender._id === "ai" || msg.type === "ai";
                  const isLast = i === messages.length - 1;

                  return (
                    <div
                      key={msg._id || i}
                      ref={isLast ? bottomRef : null}
                      className={`flex gap-2 md:gap-3 ${
                        isUser && !isAI ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {!isAI && (
                        <div
                          className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(
                            msg.sender._id
                          )}`}
                        >
                          {getInitials(msg.sender.email)}
                        </div>
                      )}

                      <div
                        className={`flex-1 min-w-0 ${
                          isUser && !isAI ? "text-right" : "text-left"
                        }`}
                      >
                        {isAI ? (
                          renderAIMessage(msg)
                        ) : (
                          <div
                            className={`inline-block max-w-full ${
                              isUser ? "text-right" : "text-left"
                            }`}
                          >
                            <div className="text-xs text-gray-400 mb-1 px-1">
                              {msg.sender.email.split("@")[0]}
                            </div>
                            <div
                              className={`px-3 md:px-4 py-2 md:py-2.5 rounded-2xl shadow-md break-words ${
                                isUser
                                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                                  : "bg-gray-800/80 text-gray-100 border border-gray-700/50"
                              }`}
                            >
                              <Markdown className="text-xs md:text-sm leading-relaxed break-words">
                                {msg.message}
                              </Markdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {aiTyping && (
                <div className="flex gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                    <i className="ri-robot-2-fill text-white text-xs md:text-sm" />
                  </div>
                  <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-2xl bg-gray-800/60 border border-purple-500/30">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                    <span className="text-xs text-purple-400">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {sidePannelOpen && (
              <div
                onClick={() => setsidePannelOpen(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10"
              />
            )}

            <div
              className={`sidePannel absolute top-0 left-0 h-full w-full z-20 rounded-r-2xl bg-gray-800/95 backdrop-blur-xl shadow-2xl border-r border-gray-700/50 transform transition-transform duration-300 ${
                sidePannelOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-700/50">
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <i className="ri-team-line text-purple-400" />
                  Collaborators ({collaborators.length})
                </h2>
                <button
                  onClick={() => setsidePannelOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition"
                >
                  <i className="ri-close-line text-xl cursor-pointer" />
                </button>
              </div>
              <div className="users flex flex-col gap-2 p-3 md:p-4 overflow-y-auto max-h-[calc(100%-5rem)]">
                {Array.isArray(collaborators) && collaborators.length > 0 ? (
                  collaborators.map((collaborator) => {
                    return (
                      <div
                        key={collaborator._id}
                        className="group px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all flex items-center gap-3 border border-transparent hover:border-purple-500/30"
                      >
                        <div
                          className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(
                            collaborator._id
                          )}`}
                        >
                          {getInitials(collaborator.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h1 className="text-white text-xs md:text-sm font-medium truncate">
                            {collaborator.email.split("@")[0]}
                          </h1>
                          <p className="text-xs text-gray-400 truncate">
                            {collaborator.email}
                          </p>
                        </div>
                        <div
                          className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 flex-shrink-0"
                          title="Online"
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <i className="ri-team-line text-4xl text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">
                      No collaborators yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="inputArea p-3 md:p-4 pb-26 md:pb-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm flex-shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700/50 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent placeholder-gray-500 transition text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white transition-all shadow-lg disabled:shadow-none flex-shrink-0"
                >
                  <i className="ri-send-plane-2-fill text-base md:text-lg cursor-pointer" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Code Section - Hidden on mobile unless selected */}
        <section className={`${
          mobileView === "code" ? "flex" : "hidden md:flex"
        } flex-grow h-full w-full md:flex-row flex-col`}>
          {/* Mobile Files Drawer */}
          <div className={`${
            mobileFilesOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:relative inset-y-0 left-0 w-72 md:w-72 bg-gray-900 border-r border-gray-800/50 shadow-xl z-30 transition-transform duration-300`}>
            <div className="p-3 md:p-4 border-b border-gray-800/50 bg-gray-800/30 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <i className="ri-folder-3-line text-purple-400" />
                Files
              </h2>
              <button
                onClick={() => setMobileFilesOpen(false)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="files-tree p-3 space-y-1 overflow-y-auto max-h-[calc(100%-4rem)]">
              {Object.keys(fileTree).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <i className="ri-file-list-line text-4xl text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">No files yet</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Ask AI to generate code
                  </p>
                </div>
              ) : (
                Object.entries(fileTree).map(([fileName, fileData], indx) => (
                  <button
                    key={indx}
                    onClick={() => {
                      if (!openFiles.includes(fileName)) {
                        setOpenFiles((prev) => [...prev, fileName]);
                      }
                      setCurrentFile(fileName);
                      setMobileFilesOpen(false);
                    }}
                    className={`file-element w-full flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group ${
                      currentFile === fileName
                        ? "bg-purple-600/20 border border-purple-500/30"
                        : "hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <i className="ri-file-code-line text-yellow-400 text-lg" />
                    <span
                      className={`text-sm font-medium flex-1 text-left truncate ${
                        currentFile === fileName
                          ? "text-purple-300"
                          : "text-gray-300 group-hover:text-white"
                      }`}
                    >
                      {fileName}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Overlay for mobile files drawer */}
          {mobileFilesOpen && (
            <div
              onClick={() => setMobileFilesOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
            />
          )}

          <div className="code-editor flex-1 flex flex-col bg-gray-950 relative pb-16 md:pb-0">
            {/* Mobile Files Toggle Button */}
            {Object.keys(fileTree).length > 0 && (
              <button
                onClick={() => setMobileFilesOpen(true)}
                className="md:hidden fixed top-4 left-4 z-10 w-12 h-12 flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-700 text-white border border-purple-500 shadow-xl"
              >
                <i className="ri-folder-3-line text-xl" />
              </button>
            )}

            {currentFile ? (
              <>
                <div className="w-full bg-gray-900 border-b border-gray-800/50 overflow-x-auto">
                  <div className="flex items-center min-w-max">
                    {openFiles.map((file) => (
                      <div
                        key={file}
                        className={`px-3 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-3 cursor-pointer border-r border-gray-800/50 transition-all flex-shrink-0 ${
                          currentFile === file
                            ? "bg-gray-950 text-white"
                            : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                        }`}
                        onClick={() => setCurrentFile(file)}
                      >
                        <i className="ri-file-code-line text-xs md:text-sm" />
                        <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                          {file}
                        </span>
                        <button
                          className="text-gray-500 hover:text-red-400 transition ml-1 md:ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFiles((prev) =>
                              prev.filter((f) => f !== file)
                            );
                            if (currentFile === file) {
                              const remaining = openFiles.filter(
                                (f) => f !== file
                              );
                              setCurrentFile(
                                remaining.length > 0
                                  ? remaining[remaining.length - 1]
                                  : null
                              );
                            }
                          }}
                        >
                          <i className="ri-close-line text-xs md:text-sm cursor-pointer" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-gray-950 text-gray-100 overflow-auto">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={fileTree[currentFile]?.file?.contents || ""}
                    theme="vs-dark"
                    onChange={(value) => {
                      setFileTree((prev) => ({
                        ...prev,
                        [currentFile]: {
                          ...prev[currentFile],
                          file: { contents: value },
                        },
                      }));
                    }}
                    options={{
                      fontSize: 12,
                      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                      minimap: { enabled: window.innerWidth > 768 },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      renderWhitespace: "selection",
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 px-4">
                <i className="ri-file-search-line text-5xl md:text-6xl text-gray-700" />
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold text-gray-400 mb-1">
                    No file selected
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose a file from the sidebar to start editing
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700/50 z-40 safe-area-bottom">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => setMobileView("chat")}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                mobileView === "chat"
                  ? "text-purple-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={`ri-chat-3-${mobileView === "chat" ? "fill" : "line"} text-2xl`} />
              <span className="text-xs mt-1 font-medium">Chat</span>
            </button>
            <button
              onClick={() => setMobileView("code")}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${
                mobileView === "code"
                  ? "text-purple-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={`ri-code-s-slash-${mobileView === "code" ? "fill" : "line"} text-2xl`} />
              <span className="text-xs mt-1 font-medium">Code</span>
              {Object.keys(fileTree).length > 0 && (
                <div className="absolute top-1 right-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </main>

      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full max-w-md rounded-2xl p-4 md:p-6 relative shadow-2xl border border-gray-700/50 max-h-[90vh] flex flex-col">
            <button
              className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition z-10"
              onClick={() => setUserModalOpen(false)}
            >
              <i className="ri-close-line text-xl cursor-pointer" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <i className="ri-user-add-line text-purple-400" />
              Add Collaborators
            </h2>
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="scroll flex flex-col gap-2 overflow-y-auto flex-grow pr-1">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleUserSelect(u._id)}
                      className={`flex items-center gap-3 p-3 md:p-3.5 rounded-xl cursor-pointer transition-all border ${
                        selectedUserIds.includes(u._id)
                          ? "bg-purple-600/20 border-purple-500/50"
                          : "bg-gray-700/30 hover:bg-gray-700/50 border-transparent hover:border-gray-600/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(
                          u._id
                        )}`}
                      >
                        {getInitials(u.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-medium text-sm block truncate">
                          {u.email.split("@")[0]}
                        </span>
                        <span className="text-gray-400 text-xs truncate block">{u.email}</span>
                      </div>
                      {selectedUserIds.includes(u._id) && (
                        <i className="ri-checkbox-circle-fill text-purple-400 text-xl flex-shrink-0" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="w-full text-center py-8">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                      <i className="ri-user-search-line text-4xl text-gray-600 mb-2 block" />
                      <p className="text-gray-400 text-sm">
                        No users available
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {Array.isArray(users) && users.length > 0 && (
                <div className="pt-4 md:pt-5 flex gap-2 md:gap-3 flex-shrink-0">
                  <button
                    onClick={() => setUserModalOpen(false)}
                    className="flex-1 bg-gray-700/50 hover:bg-gray-700 text-white py-2.5 md:py-3 rounded-xl font-semibold transition-all border border-gray-600/50 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCollaborators}
                    disabled={selectedUserIds.length === 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-2.5 md:py-3 rounded-xl font-semibold transition-all shadow-lg disabled:shadow-none text-sm md:text-base"
                  >
                    Add{" "}
                    {selectedUserIds.length > 0 &&
                      `(${selectedUserIds.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Project;