/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User, Project } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProfileViewProps {
  user: User;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onLikeProject: (projectId: string) => void;
  onOpenPublishModal: () => void;
  onTriggerToast: (message: string) => void;
  onGoBack: () => void;
}

type TabType = "projects" | "contributions" | "collections" | "activity";

export default function ProfileView({
  user,
  projects,
  onSelectProject,
  onLikeProject,
  onOpenPublishModal,
  onTriggerToast,
  onGoBack,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("projects");

  // Filter projects created by this specific profile user
  const userProjects = projects.filter((p) => p.authorId === user.id);

  // Fallback projects if none made by custom author to keep gallery gorgeous
  const displayedProjects = userProjects.length > 0 ? userProjects : projects.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* If viewing a non-primary user, show a nice back button */}
      {user.id !== "alexchen" && (
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 text-primary font-semibold text-sm cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Feed</span>
        </button>
      )}

      {/* Hero Profile Header Card Layout */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden border border-[#eff4ff]">
        {/* Curved decorative background element */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-bl-full z-0 select-none pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/15 rounded-full filter blur-xl z-0 select-none pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar box */}
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md border-4 border-[#e5eeff] bg-slate-150 flex-shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-on-surface">
                  {user.name}
                </h1>
                <p className="text-sm font-semibold text-primary font-label-md mt-0.5">
                  {user.role}
                </p>
              </div>

              {/* Action Trigger */}
              <button
                onClick={onOpenPublishModal}
                className="bg-secondary text-white hover:bg-[#005049] active:scale-95 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 mx-auto md:mx-0 shadow-sm transition-all duration-150"
                id="btn-profile-new-project"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>New Project</span>
              </button>
            </div>

            <p className="text-[15px] text-on-surface-variant max-w-2xl leading-relaxed mb-6">
              {user.bio}
            </p>

            {/* Metrics Rows Grid */}
            <div className="flex flex-wrap justify-center md:justify-start gap-x-12 gap-y-4">
              <div className="text-center md:text-left select-none">
                <span className="block text-2xl font-bold text-primary">
                  {user.stats.innovations}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-outline">
                  Innovations
                </span>
              </div>
              <div className="text-center md:text-left select-none">
                <span className="block text-2xl font-bold text-primary">
                  {user.stats.collabs}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-outline">
                  Collabs
                </span>
              </div>
              <div className="text-center md:text-left select-none">
                <span className="block text-2xl font-bold text-primary">
                  {user.stats.followers}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-outline">
                  Followers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Collections Gallery Tabs */}
      <div className="flex items-center gap-8 border-b border-[#e5eeff] overflow-x-auto select-none font-label-md">
        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-4 text-sm whitespace-nowrap border-b-2 font-semibold transition-all duration-200 ${
            activeTab === "projects"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          My Projects ({displayedProjects.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("contributions");
            onTriggerToast("Viewing historic team contributions and shared patents.");
          }}
          className={`pb-4 text-sm whitespace-nowrap border-b-2 font-semibold transition-all duration-200 ${
            activeTab === "contributions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Contributions (12)
        </button>
        <button
          onClick={() => {
            setActiveTab("collections");
            onTriggerToast("Collections comprise your bookmarked team concepts.");
          }}
          className={`pb-4 text-sm whitespace-nowrap border-b-2 font-semibold transition-all duration-200 ${
            activeTab === "collections"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Collections
        </button>
        <button
          onClick={() => {
            setActiveTab("activity");
            onTriggerToast("Loading active chronological logs dashboard...");
          }}
          className={`pb-4 text-sm whitespace-nowrap border-b-2 font-semibold transition-all duration-200 ${
            activeTab === "activity"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Activity
        </button>
      </div>

      {/* Bento Grid Gallery Content Rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeTab === "projects" ? (
            displayedProjects.map((proj, idx) => {
              // Let's make the first project in the profile grid span across columns for the Bento feed look!
              const isFirstFeatured = idx === 0;
              return (
                <motion.div
                  key={proj.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`${
                    isFirstFeatured ? "md:col-span-2" : "col-span-1"
                  } bg-white rounded-2xl overflow-hidden project-card-shadow border border-[#eff4ff] flex flex-col group cursor-pointer`}
                  onClick={() => onSelectProject(proj.id)}
                  id={`profile-project-${proj.id}`}
                >
                  <div className={`relative overflow-hidden ${isFirstFeatured ? "aspect-video" : "aspect-[4/3]"}`}>
                    <img
                      src={proj.image}
                      alt={proj.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary/95 text-white px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md">
                        {proj.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                          {proj.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(window.location.href);
                            onTriggerToast("Link copied! Share progress with colleagues.");
                          }}
                          className="material-symbols-outlined text-outline hover:text-primary transition-colors text-[20px]"
                        >
                          share
                        </button>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
                        {proj.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#eff4ff] pt-4 select-none">
                      <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
                        {/* Like button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLikeProject(proj.id);
                          }}
                          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                            proj.isLiked ? "text-red-500" : ""
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[19px] ${proj.isLiked ? "material-symbols-filled" : ""}`}>
                            favorite
                          </span>
                          <span>{proj.likes}</span>
                        </button>

                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[19px]">
                            chat_bubble
                          </span>
                          <span>{proj.commentCount || 22}</span>
                        </button>
                      </div>

                      {/* Overlapping collaborative face circles */}
                      <div className="flex -space-x-1.5 focus-within:ring-1">
                        <span className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[10px] text-primary font-bold flex items-center justify-center border-2 border-white">
                          +{12 + idx}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-[#dce9ff]">
              <span className="material-symbols-outlined text-primary text-5xl mb-2">
                collections_bookmark
              </span>
              <p className="text-sm text-on-surface-variant">
                No active concepts logged in this category. Use "New Project" to add custom innovation portfolios!
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
