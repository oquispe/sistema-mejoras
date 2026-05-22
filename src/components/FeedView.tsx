/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { User, Project } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface FeedViewProps {
  currentUser: User;
  usersMap: Record<string, User>;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onSelectUser: (userId: string) => void;
  onSelectCategory: (category: string | null) => void;
  onLikeProject: (projectId: string) => void;
  onAddProject: (newProject: Project) => void;
  onTriggerToast: (message: string) => void;
}

export default function FeedView({
  currentUser,
  usersMap,
  projects,
  onSelectProject,
  onSelectUser,
  onSelectCategory,
  onLikeProject,
  onAddProject,
  onTriggerToast,
}: FeedViewProps) {
  const [composeText, setComposeText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readAndSetFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readAndSetFile(file);
    }
  };

  const readAndSetFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      onTriggerToast("Please select/drop an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      onTriggerToast("Image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Submit dynamic post
  const handleShareProgress = () => {
    if (!composeText.trim() && !attachedImage) {
      onTriggerToast("Write some details or attach an image to share your progress.");
      return;
    }

    // Creating new Project Object
    const newProject: Project = {
      id: `custom-project-${Date.now()}`,
      title: composeText.split("\n")[0]?.slice(0, 50) || "Dynamic Innovation Micro-Post",
      description: composeText.slice(0, 160) || "Sharing an interactive micro-update on current workspace designs.",
      category: "Sustainability", // default
      authorId: currentUser.id,
      image: attachedImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuALd7K46843AN8XVhQud2eAgGopaQiAjUhvOUhyxXgWOk4hSTf6ugAouqnQ6H0SSs3ntNzQ35PQR92ELzLjG3G-JtnrXoOBMAfNKMljio5fAdaxVm8w6fDlpuaq_zZznjhIsluOpFd81P-oF672v-HJSnh63qUpiXGIVOwFQ9Ctl4onlKFM-afOHjwTJHXfoosvbBZTcAMl-xtLdc6bpukzW9TBf2YnyVQb9c619eL1ZDAfDlnZlh_th8uTETWiDIcL6wJJMU5UcsSt",
      likes: 1,
      commentCount: 0,
      isLiked: true,
      tags: ["Sustainability", "Dynamic Progress"],
      vision: composeText,
      goals: ["Develop design iterations model.", "Optimize remote compute signals."],
    };

    onAddProject(newProject);
    setComposeText("");
    setAttachedImage(null);
    onTriggerToast("Project Draft Saved & shared to the Feed!");
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      {/* Central Feed Stream */}
      <div className="flex-grow max-w-2xl mx-auto w-full space-y-6">
        
        {/* Input Area / Composer */}
        <section 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white rounded-2xl shadow-sm p-5 border transition-all duration-300 ${
            isDragging 
              ? "border-secondary border-dashed scale-[1.01] bg-secondary-container/10" 
              : "border-[#eff4ff]"
          }`}
          id="feed-composer"
        >
          <div className="flex gap-4">
            {/* User Profile Avatar */}
            <img 
              alt="Alex Chen Profile" 
              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-90 select-none border border-[#dce9ff]" 
              src={currentUser.avatar}
              onClick={() => onSelectUser(currentUser.id)}
              referrerPolicy="no-referrer"
            />
            
            <div className="flex-1">
              <textarea 
                className="w-full bg-[#f8f9ff] border-none focus:ring-2 focus:ring-primary/20 rounded-xl p-3 font-normal text-[15px] text-on-surface placeholder-outline resize-none h-24 transition-all" 
                placeholder="What are you working on?"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                id="composer-textarea"
              ></textarea>

              {/* image preview if present */}
              {attachedImage && (
                <div className="relative mt-3 rounded-lg overflow-hidden max-h-48 border border-[#e5eeff]">
                  <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-2 right-2 bg-on-surface/80 text-white rounded-full p-1.5 hover:bg-black transition-colors"
                    title="Remove Image"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              {/* Action utilities */}
              <div className="flex justify-between items-center mt-3 pt-2 text-outline font-label-md select-none">
                <div className="flex gap-4 items-center">
                  {/* Select file hidden trigger */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:text-primary active:scale-90 transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low"
                    title="Attach Image"
                    id="btn-upload-click"
                  >
                    <span className="material-symbols-outlined text-[22px]">image</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <button 
                    onClick={() => onTriggerToast("Video recordings require full camera permissions.")}
                    className="hover:text-primary active:scale-90 transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low"
                    title="Record Video"
                  >
                    <span className="material-symbols-outlined text-[22px]">videocam</span>
                  </button>
                  
                  <button 
                    onClick={() => onTriggerToast("Docs attachment enabled for PDF files.")}
                    className="hover:text-primary active:scale-90 transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low"
                    title="Attach Document"
                  >
                    <span className="material-symbols-outlined text-[22px]">attach_file</span>
                  </button>

                  <span className="hidden md:inline text-[11px] text-outline font-normal">
                    {isDragging ? "Drop your image now!" : "Drag & Drop an image here"}
                  </span>
                </div>

                <button 
                  onClick={handleShareProgress}
                  className="bg-primary hover:bg-[#1e0fa3] active:scale-95 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
                  id="btn-share-progress"
                >
                  Share Progress
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feed list stream */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {projects.map((proj) => {
              const author = usersMap[proj.authorId] || currentUser;
              return (
                <motion.article 
                  key={proj.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#eff4ff] hover:shadow-md transition-shadow group flex flex-col"
                  id={`feed-project-card-${proj.id}`}
                >
                  {/* Author Header */}
                  <div className="p-5 flex items-center gap-3">
                    <img 
                      alt={author.name} 
                      className="w-10 h-10 rounded-full object-cover border border-[#e5eeff] cursor-pointer hover:opacity-90 transition-opacity" 
                      src={author.avatar}
                      onClick={() => onSelectUser(author.id)}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 
                        onClick={() => onSelectUser(author.id)}
                        className="font-semibold text-[15px] text-on-surface hover:text-primary cursor-pointer select-none transition-colors"
                      >
                        {author.name}
                      </h4>
                      <p className="text-[11px] font-medium text-on-surface-variant font-label-md">
                        {author.role} • 2h ago
                      </p>
                    </div>
                  </div>

                  {/* Core Written Details */}
                  <div className="px-5 pb-3">
                    <h3 
                      onClick={() => onSelectProject(proj.id)}
                      className="text-lg font-bold text-primary group-hover:text-primary/90 mt-0.5 mb-1 cursor-pointer transition-colors"
                    >
                      {proj.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  {/* High quality visual representation */}
                  {proj.image && (
                    <div 
                      onClick={() => onSelectProject(proj.id)}
                      className="aspect-video w-full bg-[#e5eeff] overflow-hidden cursor-pointer"
                    >
                      <img 
                        src={proj.image} 
                        alt={proj.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Feed Interaction Action Tray */}
                  <div className="p-4 flex items-center justify-between border-t border-[#eff4ff]/60 bg-[#f8f9ff]/40 select-none">
                    <div className="flex gap-6">
                      {/* Like Action */}
                      <button 
                        onClick={() => onLikeProject(proj.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold font-label-md transition-colors ${
                          proj.isLiked 
                            ? "text-red-500 font-bold" 
                            : "text-on-surface-variant hover:text-red-500"
                        }`}
                        id={`btn-like-${proj.id}`}
                      >
                        <span className={`material-symbols-outlined text-[19px] ${proj.isLiked ? "material-symbols-filled text-red-500" : ""}`}>
                          favorite
                        </span>
                        <span>{proj.likes}</span>
                      </button>

                      {/* Comment Navigation Link */}
                      <button 
                        onClick={() => onSelectProject(proj.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
                        id={`btn-comment-nav-${proj.id}`}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          chat_bubble
                        </span>
                        <span>{proj.commentCount || 12}</span>
                      </button>

                      {/* Share link copy */}
                      <button 
                        onClick={() => {
                          const url = window.location.href;
                          navigator.clipboard.writeText(url);
                          onTriggerToast("Link copied to clipboard! Share the inspiration.");
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          share
                        </span>
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Miniature collaborator faces bubbles */}
                    <div className="flex items-center -space-x-1.5">
                      <img 
                        className="w-6 h-6 rounded-full border border-white" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDq2xVLKaZ49rEjZN27aYouoILmiNHewdKozvrgpG4W7y6_IEn7CfeQFpQvHctFsswwOwOoPPcVlqaCUSkG3CA7fvhOqqacPvHQ5OzmIGWT8qpk5yJgPw8nXvDBy8xlgSe-Bxh86YpdxsCu9e3uo4RaESwmfNlZ7KXu2AhXLDMnUAOUi9L5auNuZqDcaaPO2SsQGht0UpcBoWf9OTSYzrtER-cYsV4SNTXbR4SozcGLjeKr98nawzzvrzyHmwWMGOnn834pKjcn3HZL" 
                        referrerPolicy="no-referrer"
                        alt="collaboration face"
                      />
                      <img 
                        className="w-6 h-6 rounded-full border border-white" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8TEMcM9u4pE4o7Ksf_wLUY0yfFozRYUm-00DRImU_59t-y-BBx_GDcOHjjRD7JJDHC-VUYLGFQpB6QvjlNPx2mCNjkrSNCM0AiueEGLfBYJ0bmoiahsDna3P-7GOnSspeDknH2Q4n9uaDXX0OS6DXq2WnOcrtoz66Ew0LEjRz6dxiniQeZgaSfUsJ2-ts4JxRPr_ULWXRXWhq4TZrVJm5dFJZJAMk9B_xxpyiS0Yz7BBO8wA5KFUZjyJKkGz0LuMwWJd8M2zrlXCO" 
                        referrerPolicy="no-referrer"
                        alt="collaboration face"
                      />
                      <span className="w-6 h-6 rounded-full bg-surface-container-high text-[10px] text-primary font-bold flex items-center justify-center border border-white">
                        +12
                      </span>
                    </div>

                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Sidebar - Trending Innovations Sidebar Widget */}
      <aside className="hidden xl:block w-80 space-y-6 sticky top-24 h-fit">
        
        {/* Trending grid list */}
        <section className="bg-white rounded-2xl shadow-sm p-5 border border-[#eff4ff]">
          <h3 className="font-bold text-lg text-on-surface mb-4">Trending Innovations</h3>
          
          <div className="space-y-4">
            <div 
              onClick={() => onSelectCategory("Sustainability")} 
              className="group cursor-pointer select-none"
            >
              <span className="text-xs font-bold text-secondary text-teal hover:underline uppercase tracking-wide">
                #GreenComputing
              </span>
              <h5 className="font-semibold text-[13.5px] text-on-surface group-hover:text-primary transition-colors leading-tight mt-0.5">
                Server farms powered by ocean waves
              </h5>
              <p className="text-[11px] font-medium text-outline mt-0.5">
                1.2k innovators active
              </p>
            </div>

            <div 
              onClick={() => onSelectCategory("UI Design")} 
              className="group cursor-pointer select-none"
            >
              <span className="text-xs font-bold text-secondary text-teal hover:underline uppercase tracking-wide">
                #ARCollaboration
              </span>
              <h5 className="font-semibold text-[13.5px] text-on-surface group-hover:text-primary transition-colors leading-tight mt-0.5">
                3D workspace for remote engineers
              </h5>
              <p className="text-[11px] font-medium text-outline mt-0.5">
                856 projects shared
              </p>
            </div>

            <div 
              onClick={() => onSelectCategory("Machine Learning")} 
              className="group cursor-pointer select-none"
            >
              <span className="text-xs font-bold text-secondary text-teal hover:underline uppercase tracking-wide">
                #QuantumDesign
              </span>
              <h5 className="font-semibold text-[13.5px] text-on-surface group-hover:text-primary transition-colors leading-tight mt-0.5">
                Algorithm visualization in 4D space
              </h5>
              <p className="text-[11px] font-medium text-outline mt-0.5">
                432 innovators active
              </p>
            </div>
          </div>

          <button 
            onClick={() => onSelectCategory(null)} 
            className="w-full mt-5 text-primary text-[13px] font-bold hover:underline transition-all duration-150"
          >
            See more topics
          </button>
        </section>

        {/* Upgrade Pro Promotional Callout */}
        <section className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-5 text-on-primary shadow-lg border border-primary/20">
          <h4 className="font-bold text-lg mb-1 text-white">Innovate Hub Pro</h4>
          <p className="text-xs font-light text-white/90 leading-relaxed mb-4">
            Unlock advanced patent tracking, priority compute modeling, and private collaboration rooms.
          </p>
          <button 
            onClick={() => onTriggerToast("You've successfully initiated the Pro workspace preview activation!")}
            className="w-full bg-white text-primary hover:bg-white/95 active:scale-95 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm"
          >
            Upgrade Now
          </button>
        </section>

        {/* Footnotes links */}
        <footer className="px-4 font-label-sm select-none">
          <div className="flex flex-wrap gap-2 text-[11px] text-outline">
            <a className="hover:underline cursor-pointer">About</a>
            <span>•</span>
            <a className="hover:underline cursor-pointer">Help</a>
            <span>•</span>
            <a className="hover:underline cursor-pointer">Privacy</a>
            <span>•</span>
            <a className="hover:underline cursor-pointer">Terms</a>
          </div>
          <p className="mt-2 text-[10px] text-outline/85 tracking-wide">
            © 2026 InnovateHub Inc. Crafted in Cloud Native Workspace
          </p>
        </footer>
      </aside>
    </div>
  );
}
