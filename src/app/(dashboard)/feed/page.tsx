"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, MessageCircle, Share2, Globe, Users, MapPin,
  Camera, Send, Trash2, Image as ImageIcon, X, ChevronLeft,
  ChevronRight, Sparkles, RefreshCw, Bookmark, MoreHorizontal,
  Eye, TrendingUp
} from "lucide-react";

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  postType: string;
  visibility: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: string;
  author: { id: string; name: string; photoUrl: string | null; district?: { name: string } };
  sharedPost?: { id: string; content: string; author: { id: string; name: string }; createdAt: string; mediaUrls?: string[] } | null;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function VisibilityIcon({ v }: { v: string }) {
  if (v === "FRIENDS") return <Users size={11} />;
  if (v === "DISTRICT") return <MapPin size={11} />;
  return <Globe size={11} />;
}

function Avatar({ src, name, size = 40, ring = false }: { src: string | null; name: string; size?: number; ring?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const cls = `rounded-full object-cover ${ring ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-primary" : ""}`;
  if (src) return <img src={src} alt={name} className={cls} style={{ width: size, height: size }} />;
  return (
    <div className={`rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white font-semibold ${ring ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-primary" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

// Render post content with hashtag highlighting
function PostContent({ content, className = "" }: { content: string; className?: string }) {
  const parts = content.split(/(#\w+)/g);
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className="text-accent font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// Image carousel for multi-image posts
function ImageCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);
  if (urls.length === 0) return null;
  if (urls.length === 1) return (
    <div className="rounded-2xl overflow-hidden bg-surface-tertiary">
      <img src={urls[0]} alt="" className="w-full object-cover max-h-96" loading="lazy" />
    </div>
  );
  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-tertiary">
      <img src={urls[idx]} alt="" className="w-full object-cover max-h-96 transition-opacity" loading="lazy" />
      {idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          <ChevronLeft size={16} className="text-white" />
        </button>
      )}
      {idx < urls.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          <ChevronRight size={16} className="text-white" />
        </button>
      )}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {urls.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [composerOpen, setComposerOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTap = useRef<{ id: string; time: number }>({ id: "", time: 0 });

  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts || []);
      }
      setNextCursor(data.nextCursor);
    } catch (e) {
      console.error("Feed error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchFeed();
  }, [status, router, fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchFeed(nextCursor);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleImagePick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const handlePost = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mediaUrls,
          postType: mediaUrls.length > 0 ? "PHOTO" : "TEXT",
          visibility,
        }),
      });
      if (res.ok) {
        setContent("");
        setMediaUrls([]);
        setComposerOpen(false);
        fetchFeed();
      }
    } catch (e) {
      console.error("Post error:", e);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    );
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  };

  // Double-tap to like
  const handleDoubleTap = (postId: string, isLiked: boolean) => {
    const now = Date.now();
    if (lastTap.current.id === postId && now - lastTap.current.time < 300) {
      if (!isLiked) handleLike(postId);
      setDoubleTapId(postId);
      setTimeout(() => setDoubleTapId(null), 800);
      lastTap.current = { id: "", time: 0 };
    } else {
      lastTap.current = { id: postId, time: now };
    }
  };

  const handleShare = async (postId: string) => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post",
          url: `${window.location.origin}/feed/post/${postId}`,
        });
        return;
      } catch {}
    }
    // Fallback: share within app
    await fetch(`/api/posts/${postId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: "PUBLIC" }),
    });
    fetchFeed();
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="px-4 pt-3 pb-20 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-primary rounded-2xl p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-surface-tertiary rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-surface-tertiary rounded-full w-28" />
                <div className="h-2.5 bg-surface-tertiary rounded-full w-20" />
              </div>
            </div>
            <div className="h-20 bg-surface-tertiary rounded-xl" />
            <div className="h-10 bg-surface-tertiary rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Sticky header with refresh */}
      <div className="sticky top-0 z-20 bg-surface-secondary/80 backdrop-blur-xl px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-label-primary">Feed</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`w-9 h-9 rounded-full bg-surface-primary flex items-center justify-center tap-scale ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} className="text-label-secondary" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* ─── Compact Composer ─── */}
        {!composerOpen ? (
          <div
            onClick={() => { setComposerOpen(true); setTimeout(() => textareaRef.current?.focus(), 100); }}
            className="bg-surface-primary rounded-2xl p-3.5 flex items-center gap-3 tap-scale cursor-pointer"
          >
            <Avatar src={null} name={session?.user?.name || "U"} size={38} />
            <span className="text-sm text-label-tertiary flex-1">Share something with the movement...</span>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Camera size={15} className="text-accent" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-primary rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar src={null} name={session?.user?.name || "U"} size={38} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-label-primary">{session?.user?.name}</span>
                  <select
                    className="bg-surface-tertiary rounded-full px-2.5 py-1 text-[11px] text-label-secondary border-none focus:outline-none"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="PUBLIC">🌍 Public</option>
                    <option value="FRIENDS">👥 Friends</option>
                    <option value="DISTRICT">📍 District</option>
                  </select>
                </div>
                <textarea
                  ref={textareaRef}
                  className="w-full bg-transparent text-sm text-label-primary resize-none focus:outline-none placeholder:text-label-tertiary min-h-[60px]"
                  placeholder="What's happening in the movement?"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Image previews */}
            {mediaUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    <button
                      onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-separator/50 pt-3">
              <div className="flex items-center gap-1">
                <button onClick={handleImagePick} className="w-9 h-9 rounded-full hover:bg-surface-tertiary flex items-center justify-center transition-colors">
                  <ImageIcon size={18} className="text-accent" />
                </button>
                <button onClick={handleImagePick} className="w-9 h-9 rounded-full hover:bg-surface-tertiary flex items-center justify-center transition-colors">
                  <Camera size={18} className="text-accent" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setComposerOpen(false); setContent(""); setMediaUrls([]); }}
                  className="px-4 py-2 rounded-full text-xs font-medium text-label-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={(!content.trim() && mediaUrls.length === 0) || posting}
                  className="px-5 py-2 rounded-full bg-accent text-white text-xs font-semibold disabled:opacity-40 tap-scale flex items-center gap-1.5"
                >
                  {posting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Posts ─── */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-accent" />
            </div>
            <p className="text-base font-semibold text-label-primary mb-1">No posts yet</p>
            <p className="text-sm text-label-tertiary">Be the first to share something with the movement!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-surface-primary rounded-2xl overflow-hidden">
              {/* Post Header */}
              <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                <Link href={`/profile/${post.author.id}`} className="tap-scale">
                  <Avatar src={post.author.photoUrl} name={post.author.name} size={42} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${post.author.id}`} className="text-sm font-semibold text-label-primary">
                    {post.author.name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-[11px] text-label-tertiary">
                    <span>{timeAgo(post.createdAt)}</span>
                    <span>·</span>
                    <VisibilityIcon v={post.visibility} />
                    {post.author.district && (
                      <>
                        <span>·</span>
                        <span className="truncate">{post.author.district.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                    className="w-8 h-8 rounded-full hover:bg-surface-tertiary flex items-center justify-center"
                  >
                    <MoreHorizontal size={16} className="text-label-tertiary" />
                  </button>
                  {showMenu === post.id && (
                    <div className="absolute right-0 top-9 bg-surface-primary rounded-xl shadow-lg border border-separator/50 py-1 min-w-[140px] z-10">
                      <Link href={`/feed/post/${post.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-label-primary hover:bg-surface-secondary"
                        onClick={() => setShowMenu(null)}>
                        <Eye size={14} /> View Post
                      </Link>
                      {post.author.id === session?.user?.id && (
                        <button
                          onClick={() => { handleDelete(post.id); setShowMenu(null); }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-surface-secondary w-full text-left"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content — double tap to like */}
              <div
                className="px-4 pb-3 relative"
                onClick={() => handleDoubleTap(post.id, post.isLiked)}
              >
                <PostContent content={post.content} className="text-sm text-label-primary leading-relaxed" />

                {/* Double-tap heart animation */}
                {doubleTapId === post.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart size={64} className="text-red-500 animate-ping" fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Media */}
              {post.mediaUrls?.length > 0 && (
                <div className="px-4 pb-3" onClick={() => handleDoubleTap(post.id, post.isLiked)}>
                  <ImageCarousel urls={post.mediaUrls} />
                </div>
              )}

              {/* Shared Post */}
              {post.sharedPost && (
                <div className="mx-4 mb-3 border border-separator/50 rounded-xl p-3 bg-surface-secondary">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-accent">
                      {post.sharedPost.author.name[0]}
                    </div>
                    <span className="text-[11px] font-semibold text-label-secondary">{post.sharedPost.author.name}</span>
                    <span className="text-[10px] text-label-quaternary">{timeAgo(post.sharedPost.createdAt)}</span>
                  </div>
                  <PostContent content={post.sharedPost.content} className="text-xs text-label-tertiary line-clamp-3" />
                </div>
              )}

              {/* Engagement stats */}
              {(post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
                <div className="px-4 pb-2 flex items-center gap-3 text-[11px] text-label-tertiary">
                  {post.likesCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                        <Heart size={8} className="text-white" fill="white" />
                      </span>
                      {post.likesCount}
                    </span>
                  )}
                  <span className="flex-1" />
                  {post.commentsCount > 0 && <span>{post.commentsCount} comment{post.commentsCount > 1 ? "s" : ""}</span>}
                  {post.sharesCount > 0 && <span>{post.sharesCount} share{post.sharesCount > 1 ? "s" : ""}</span>}
                </div>
              )}

              {/* Action buttons */}
              <div className="px-2 pb-2">
                <div className="flex items-center border-t border-separator/30 pt-1">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center tap-scale ${
                      post.isLiked ? "text-red-500" : "text-label-tertiary active:text-red-500"
                    }`}
                  >
                    <Heart size={17} fill={post.isLiked ? "currentColor" : "none"} strokeWidth={post.isLiked ? 0 : 1.8} />
                    Like
                  </button>
                  <Link
                    href={`/feed/post/${post.id}`}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-label-tertiary active:text-accent transition-all flex-1 justify-center tap-scale"
                  >
                    <MessageCircle size={17} strokeWidth={1.8} />
                    Comment
                  </Link>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-label-tertiary active:text-accent transition-all flex-1 justify-center tap-scale"
                  >
                    <Share2 size={17} strokeWidth={1.8} />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerRef} className="h-10 flex items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-xs text-label-tertiary">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      </div>

      {/* Close menu on background tap */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(null)} />
      )}
    </div>
  );
}
