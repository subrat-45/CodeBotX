import React, { useContext, useEffect, useState } from "react";
import UserContext from "../Context/userContext";
import axios from "../Config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProjects = () => {
    setLoading(true);
    axios
      .get("/projects/all")
      .then((res) => {
        console.log(res.data);
        setProject(res.data.projects || []);
      })
      .catch((err) => {
        console.log(err);
        setProject([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post(
        "/projects/create",
        { name: projectName },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log("Project created:", res.data);
        setShowModal(false);
        setProjectName("");
        // Add the new project to the list immediately
        if (res.data.project) {
          setProject((prev) => [...prev, res.data.project]);
        } else {
          // If the response doesn't include the project, fetch all projects
          fetchProjects();
        }
      })
      .catch((err) => {
        console.error("Axios Error:", err.name);
        if (err.response) {
          console.error(
            "Backend error:",
            err.response.status,
            err.response.data
          );
          alert(`Server error: ${err.response.data.error || err.message}`);
        } else if (err.request) {
          console.error("📡 No response from server:", err.request);
          alert("No response received. Check backend server.");
        } else {
          console.error("❗ Axios setup error:", err.message);
          alert("Error setting up request: " + err.message);
        }
      });
  };

  const logoutHandler = () => {
    axios
      .get("/users/logout", {
        withCredentials: true,
      })
      .then((res) => {
        console.log(res.data);
        localStorage.removeItem("token");
        navigate("/login");
      })
      .catch((err) => {
        console.log(err.message);
        // Still navigate to login even if there's an error
        localStorage.removeItem("token");
        navigate("/login");
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getProjectIcon = (name) => {
    const icons = [
      "ri-code-box-line",
      "ri-terminal-box-line",
      "ri-window-line",
      "ri-dashboard-line",
      "ri-layout-grid-line",
      "ri-stack-line",
    ];
    const index = name.charCodeAt(0) % icons.length;
    return icons[index];
  };

  const getProjectColor = (name) => {
    const colors = [
      "from-purple-600 to-purple-800",
      "from-blue-600 to-blue-800",
      "from-green-600 to-green-800",
      "from-pink-600 to-pink-800",
      "from-orange-600 to-orange-800",
      "from-teal-600 to-teal-800",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
            <i className="ri-code-s-slash-line text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Project Hub</h1>
            <p className="text-sm text-gray-400">Manage your projects</p>
          </div>
        </div>

        <button
          onClick={logoutHandler}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-xl font-semibold transition-all border border-red-500/30 hover:border-red-500/50"
        >
          <i className="ri-logout-box-line"></i>
          <span>Logout</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        {/* Welcome Card */}
        <div className="mb-8 p-8 bg-gradient-to-r from-gray-800/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.email?.split("@")[0] || "User"}!
              </h2>
              <p className="text-gray-400">
                You have {project.length} project{project.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105"
            >
              <i className="ri-add-line text-2xl"></i>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="ri-folder-3-line text-purple-400"></i>
            Your Projects
          </h3>
          {project.length > 0 && (
            <button
              onClick={fetchProjects}
              className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              Refresh
            </button>
          )}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading projects...</p>
            </div>
          </div>
        ) : project.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 border border-gray-700/50">
              <i className="ri-folder-open-line text-5xl text-gray-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Create your first project to get started with collaborative development
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg"
            >
              <i className="ri-add-line text-xl"></i>
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {project.map((proj) => (
              <div
                key={proj._id}
                onClick={() => navigate("/project", { state: proj })}
                className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
              >
                {/* Project Header with Icon */}
                <div className={`h-32 bg-gradient-to-br ${getProjectColor(proj.name)} p-6 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <i className={`${getProjectIcon(proj.name)} text-6xl text-white/90 relative z-10`}></i>
                  <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs text-white font-medium">
                      {proj.users?.length || 0} <i className="ri-user-line"></i>
                    </span>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-purple-400 transition">
                    {proj.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {proj.users?.length || 0} collaborator{proj.users?.length !== 1 ? "s" : ""}
                    </span>
                    <i className="ri-arrow-right-line text-purple-400 group-hover:translate-x-1 transition"></i>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/5 transition-all duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-700/50 relative">
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                    <i className="ri-add-box-line text-purple-400 text-xl"></i>
                  </div>
                  Create New Project
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Awesome Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 text-white rounded-xl border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent placeholder-gray-500 transition"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setProjectName("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all border border-gray-600/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!projectName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg disabled:shadow-none"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;