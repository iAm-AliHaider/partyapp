"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Globe, Users, MapPin, Image, Send, MoreHorizontal, Trash2 } from "lucide-react";

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
  sharedPost?: { id: string; content: string; author: { id: string; name: string }; createdAt: string } | null;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(date).toLocaleDateString();
}

function VisibilityIcon({ v }: { v: string }) {
  if (v === "FRIENDS") return <Users size={12} />;
  if (v === "DISTRICT") return <MapPin size={12} />;
  return <Globe size={12} />;
}

function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-accent flex items-center justify-center text-white font-semibold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

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

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          postType: mediaUrl ? "PHOTO" : "TEXT",
          visibility,
        }),
      });
      if (res.ok) {
        setContent("");
        setMediaUrl("");
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

  const handleShare = async (postId: string) => {
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
          <div key={i} className="card animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-tertiary rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-surface-tertiary rounded w-24" />
                <div className="h-2 bg-surface-tertiary rounded w-16" />
              </div>
            </div>
            <div className="h-16 bg-surface-tertiary rounded" />
            <div className="h-8 bg-surface-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-20">
      <h1 className="text-title tracking-tight mb-4">Feed</h1>

      {/* Create Post */}
      <div className="card mb-4">
        <div className="flex gap-3 mb-3">
          <Avatar src={null} name={session?.user?.name || "U"} size={40} />
          <textarea
            className="flex-1 bg-surface-tertiary rounded-xl px-4 py-2.5 text-body resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-label-tertiary"
            placeholder="Share something with the movement..."
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="bg-surface-tertiary rounded-lg px-3 py-1.5 text-caption w-40 focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-label-quaternary"
              placeholder="Image URL (optional)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
            <select
              className="bg-surface-tertiary rounded-lg px-2 py-1.5 text-caption text-label-secondary focus:outline-none"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Public</option>
              <option value="FRIENDS">Friends</option>
              <option value="DISTRICT">District</option>
            </select>
          </div>
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="bg-accent text-white rounded-full px-4 py-1.5 text-caption font-semibold disabled:opacity-40 tap-scale flex items-center gap-1.5"
          >
            <Send size={14} />
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-label-tertiary text-body">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="card">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <Link href={`/profile/${post.author.id}`}>
                  <Avatar src={post.author.photoUrl} name={post.author.name} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${post.author.id}`} className="text-body font-semibold text-label-primary hover:underline">
                    {post.author.name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-caption text-label-tertiary">
                    <span>{timeAgo(post.createdAt)}</span>
                    <span>·</span>
                    <VisibilityIcon v={post.visibility} />
                    {post.author.district && (
                      <>
                        <span>·</span>
                        <span>{post.author.district.name}</span>
                      </>
                    )}
                  </div>
                </div>
                {post.author.id === session?.user?.id && (
                  <button onClick={() => handleDelete(post.id)} className="text-label-quaternary hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Content */}
              <Link href={`/feed/post/${post.id}`}>
                <p className="text-body text-label-primary mb-3 whitespace-pre-wrap">{post.content}</p>
              </Link>

              {/* Media */}
              {post.mediaUrls?.length > 0 && (
                <div className="mb-3 rounded-xl overflow-hidden">
                  {post.mediaUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-full object-cover max-h-80" />
                  ))}
                </div>
              )}

              {/* Shared Post */}
              {post.sharedPost && (
                <div className="border border-separator rounded-xl p-3 mb-3 bg-surface-secondary">
                  <p className="text-caption font-semibold text-label-secondary mb-1">{post.sharedPost.author.name}</p>
                  <p className="text-caption text-label-tertiary">{post.sharedPost.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 border-t border-separator pt-2.5 -mx-1">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-medium transition-colors flex-1 justify-center ${
                    post.isLiked ? "text-red-500" : "text-label-tertiary hover:text-red-500"
                  }`}
                >
                  <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} />
                  {post.likesCount > 0 && post.likesCount}
                </button>
                <Link
                  href={`/feed/post/${post.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-medium text-label-tertiary hover:text-accent transition-colors flex-1 justify-center"
                >
                  <MessageCircle size={16} />
                  {post.commentsCount > 0 && post.commentsCount}
                </Link>
                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-medium text-label-tertiary hover:text-accent transition-colors flex-1 justify-center"
                >
                  <Share2 size={16} />
                  {post.sharesCount > 0 && post.sharesCount}
                </button>
              </div>
            </div>
          ))}

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="h-10 flex items-center justify-center">
            {loadingMore && <div className="text-caption text-label-tertiary">Loading more...</div>}
          </div>
        </div>
      )}
    </div>
  );
}
