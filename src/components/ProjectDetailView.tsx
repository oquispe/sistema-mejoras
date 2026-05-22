/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User, Project, Comment } from "../types";
import { initialComments } from "../data";

interface ProjectDetailViewProps {
  project: Project;
  currentUser: User;
  usersMap: Record<string, User>;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onLikeProject: (projectId: string) => void;
  onTriggerToast: (message: string) => void;
}

export default function ProjectDetailView({
  project,
  currentUser,
  usersMap,
  projects,
  onSelectProject,
  onLikeProject,
  onTriggerToast,
}: ProjectDetailViewProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const author = usersMap[project.authorId] || currentUser;

  // Handle adding a live comment
  const handlePostComment = () => {
    if (!newCommentText.trim()) {
      onTriggerToast("Write a message inside the textbox to discuss.");
      return;
    }

    const commentToAdd: Comment = {
      id: `comment-custom-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatar,
      content: newCommentText,
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
      isAuthor: author.id === currentUser.id,
    };

    setComments([commentToAdd, ...comments]);
    setNewCommentText("");
    onTriggerToast("Comment successfully posted to discussion thread!");
  };

  // Handle liking commentary
  const handleLikeComment = (commentId: string) => {
    setComments(
      comments.map((c) => {
        if (c.id === commentId) {
          const liked = !c.isLiked;
          return {
            ...c,
            likes: liked ? c.likes + 1 : c.likes - 1,
            isLiked: liked,
          };
        }
        return c;
      })
    );
  };

  // Group comments: find replies and parent comments
  const parentComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  // Filter 3 related projects to show on sidebar (not current project)
  const relatedList = projects
    .filter((p) => p.id !== project.id)
    .slice(0, 3);

  // Extract stack tags
  const tagsList = project.tags || ["Sustainability", "React Native", "UI Design"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 select-none leading-relaxed">
      {/* Left Content Area Column */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Detail Hero Section */}
        <section className="bg-white rounded-2xl overflow-hidden project-card-shadow border border-[#eff4ff]">
          <div className="aspect-video w-full relative bg-slate-900">
            <img 
              className="w-full h-full object-cover opacity-90" 
              src={project.image} 
              alt={project.title}
              referrerPolicy="no-referrer"
            />
            {/* Absolute bottom header badge block */}
            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10">
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl max-w-xl shadow-lg border border-[#e5eeff]/50">
                <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-3 py-1 rounded-full mb-1 inline-block">
                  {project.category}
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-on-surface leading-tight mt-0.5">
                  {project.title}
                </h1>
              </div>

              {/* Like share widget */}
              <div className="flex gap-2">
                <button 
                  onClick={() => onLikeProject(project.id)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md bg-white text-red-500 hover:scale-105 active:scale-95 transition-all ${
                    project.isLiked ? "bg-red-50" : "text-on-surface-variant hover:text-red-500"
                  }`}
                  id="detail-hero-like-btn"
                  title="Appreciate Project"
                >
                  <span className={`material-symbols-outlined text-[24px] ${project.isLiked ? "material-symbols-filled" : ""}`}>
                    favorite
                  </span>
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    onTriggerToast("Detail page URL copied successfully!");
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md text-on-surface-variant hover:text-primary hover:scale-105 active:scale-95 transition-all"
                  title="Share Project"
                >
                  <span className="material-symbols-outlined text-[24px]">share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Project Author Bio and Counters Row */}
          <div className="p-5 md:p-6 flex items-center justify-between flex-wrap gap-4 border-b border-[#eff4ff]">
            <div className="flex items-center gap-3">
              <img 
                className="w-12 h-12 rounded-full object-cover border border-[#e5eeff]" 
                src={author.avatar} 
                alt={author.name}
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-bold text-[15px] text-on-surface">{author.name}</p>
                <p className="text-[11px] font-medium text-on-surface-variant font-label-md">
                  {author.role} • May 2026
                </p>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{project.likes}</p>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wide">
                  Appreciations
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{project.commentCount + comments.length - 3}</p>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wide">
                  Comments
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="p-5 md:p-6 space-y-4 font-normal text-on-surface-variant text-[15px] leading-relaxed">
            <h2 className="text-lg font-bold text-on-surface">The Vision</h2>
            <p>
              {project.vision || "We integrated computational systems architecture with physical ecology prototypes to construct adaptive landscapes. This ecosystem aligns communities, landscape designers, and smart telemetry meters together recursively."}
            </p>
            <p>
              By translating complex multi-frequency data lines into physical environmental changes, we establish an ambient interface for localized cooling, biodiversity logging, and city foliage automation.
            </p>

            <h3 className="text-xs font-bold text-primary uppercase tracking-widest pt-4">
              Project Goals
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 select-none">
              {(project.goals || [
                "Real-time biodiversity tracking via IoT sensors.",
                "Community voting on local park features.",
                "AR visualization for proposed green structures.",
                "Carbon sequestration reporting for developers."
              ]).map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary font-bold text-[19px] mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Discussion Thread Section */}
        <section className="bg-white rounded-2xl p-5 md:p-6 project-card-shadow border border-[#eff4ff] space-y-6">
          <h2 className="text-lg font-bold text-on-surface">
            Discussion ({comments.length})
          </h2>

          {/* Write comment input composer */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
              <img 
                className="w-full h-full object-cover" 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-grow space-y-3">
              <textarea 
                className="w-full p-3 border border-[#cfd2d9] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm font-normal text-on-surface placeholder-outline bg-[#f8f9ff] resize-none h-20 transition-all" 
                placeholder="Add to the conversation..."
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                id="comment-composer-textarea"
              ></textarea>
              <div className="flex justify-end">
                <button 
                  onClick={handlePostComment}
                  className="bg-primary hover:bg-[#1e0fa3] text-white px-5 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>

          {/* Comments Rendering Stream */}
          <div className="space-y-6 pt-4">
            {parentComments.map((comment) => {
              // Find replies for this specific parent comment
              const commentReplies = replies.filter((r) => r.parentId === comment.id);

              return (
                <div key={comment.id} className="space-y-4">
                  {/* Parent comment */}
                  <div className="flex gap-3">
                    <img 
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#eff4ff]" 
                      src={comment.authorAvatar} 
                      alt={comment.authorName}
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-on-surface">{comment.authorName}</p>
                        {comment.isAuthor && (
                          <span className="text-[9px] font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-md uppercase">
                            Author
                          </span>
                        )}
                        <span className="text-[10px] text-outline">• {comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 select-none">
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-[11px] font-bold ${
                            comment.isLiked ? "text-red-500" : "text-outline hover:text-red-500"
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[16px] ${comment.isLiked ? "material-symbols-filled text-red-500" : ""}`}>
                            thumb_up
                          </span>
                          <span>{comment.likes}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setNewCommentText(`@${comment.authorName} `);
                            document.getElementById("comment-composer-textarea")?.focus();
                          }}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Threaded Indented replies */}
                  {commentReplies.map((reply) => (
                    <div key={reply.id} className="ml-12 md:ml-14 threaded-line space-y-4">
                      <div className="flex gap-3">
                        <img 
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#eff4ff]" 
                          src={reply.authorAvatar} 
                          alt={reply.authorName}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-on-surface">
                              {reply.authorName}
                              {reply.isAuthor && (
                                <span className="text-[8px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-md uppercase ml-1">
                                  Author
                                </span>
                              )}
                            </p>
                            <span className="text-[9px] text-outline">• {reply.timestamp}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">{reply.content}</p>
                          <div className="flex items-center gap-4 mt-1.5 select-none">
                            <button 
                              onClick={() => handleLikeComment(reply.id)}
                              className={`flex items-center gap-1 text-[10px] font-bold ${
                                reply.isLiked ? "text-red-500" : "text-outline hover:text-red-500"
                              }`}
                            >
                              <span className={`material-symbols-outlined text-[14px] ${reply.isLiked ? "material-symbols-filled text-red-500" : ""}`}>
                                thumb_up
                              </span>
                              <span>{reply.likes}</span>
                            </button>
                            <button 
                              onClick={() => {
                                setNewCommentText(`Reply: @${reply.authorName} `);
                                document.getElementById("comment-composer-textarea")?.focus();
                              }}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Detail Right Sidebar Column */}
      <aside className="lg:col-span-4 space-y-6">
        
        {/* Project Stack tags module */}
        <div className="bg-white rounded-2xl p-5 border border-[#eff4ff] shadow-sm select-none">
          <h3 className="font-bold text-xs font-label-md text-on-surface uppercase tracking-wider mb-3">
            Project Stack
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {tagsList.map((tag, idx) => (
              <span 
                key={idx}
                className="bg-surface-container-low text-primary text-xs font-semibold px-3 py-1.5 rounded-full select-none cursor-pointer hover:bg-surface-container hover:scale-105 transition-all duration-150"
                onClick={() => onTriggerToast(`Stack filtered for ${tag}`)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related Projects vertical stack list cards */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-on-surface">Related Projects</h3>
          
          {relatedList.map((relProj) => (
            <div 
              key={relProj.id}
              onClick={() => onSelectProject(relProj.id)}
              className="bg-white rounded-2xl overflow-hidden project-card-shadow border border-[#eff4ff]/70 group cursor-pointer transition-all duration-300 hover:-translate-y-1 block"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img 
                  src={relProj.image} 
                  alt={relProj.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[14px] text-on-surface group-hover:text-primary transition-colors leading-snug">
                  {relProj.title}
                </h4>
                <p className="text-[11px] font-semibold text-outline tracking-tight mt-1">
                  by {usersMap[relProj.authorId]?.name || "Anonymous creator"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Messaging Collaborate CTA Block */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl text-on-primary shadow-lg border border-primary/20 space-y-4">
          <h4 className="font-bold text-xl text-white">Collaborate?</h4>
          <p className="text-xs text-white/95 font-light leading-relaxed">
            {author.name} is currently open to discussing new high-end sustainability and architectural tech opportunities.
          </p>
          <button 
            onClick={() => {
              onTriggerToast(`Inquiry request successfully dispatched. ${author.name} will respond to your registered email collancof@gmail.com!`);
            }}
            className="w-full bg-white text-primary hover:bg-[#eff4ff] active:scale-95 font-semibold text-xs py-3 rounded-full transition-all shadow-sm"
          >
            Send a Message
          </button>
        </div>
      </aside>
    </div>
  );
}
