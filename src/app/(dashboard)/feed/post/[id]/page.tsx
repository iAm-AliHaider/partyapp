"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Globe, Users, MapPin, ArrowLeft, Send, ChevronDown } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-accent flex items-center justify-center text-white font-semibold" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

interface Comment {
  id: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  parentId?: string | null;
  author: { id: string; name: string; photoUrl: string | null };
  replies?: Comment[];
  _count?: { replies: number };
}

export default function PostDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && postId) fetchPost();
  }, [status, postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) { router.push("/feed"); return; }
      setPost(await res.json());
    } catch {
      router.push("/feed");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    setPost({ ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 });
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText, parentId: replyTo?.id || null }),
      });
      if (res.ok) {
        setCommentText("");
        setReplyTo(null);
        fetchPost();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-3 pb-20">
        <div className="card animate-pulse space-y-4">
          <div className="h-10 bg-surface-tertiary rounded" />
          <div className="h-24 bg-surface-tertiary rounded" />
          <div className="h-8 bg-surface-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="px-4 pt-3 pb-24">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-accent text-caption font-medium mb-4 tap-scale">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Post */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${post.author.id}`}>
            <Avatar src={post.author.photoUrl} name={post.author.name} size={44} />
          </Link>
          <div>
            <Link href={`/profile/${post.author.id}`} className="text-body font-semibold text-label-primary hover:underline">
              {post.author.name}
            </Link>
            <div className="flex items-center gap-1.5 text-caption text-label-tertiary">
              <span>{timeAgo(post.createdAt)}</span>
              {post.author.district && <><span>·</span><span>{post.author.district.name}</span></>}
            </div>
          </div>
        </div>

        <p className="text-body text-label-primary mb-3 whitespace-pre-wrap">{post.content}</p>

        {post.mediaUrls?.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden">
            {post.mediaUrls.map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="w-full object-cover max-h-96" />
            ))}
          </div>
        )}

        {post.sharedPost && (
          <div className="border border-separator rounded-xl p-3 mb-3 bg-surface-secondary">
            <p className="text-caption font-semibold text-label-secondary mb-1">{post.sharedPost.author.name}</p>
            <p className="text-caption text-label-tertiary">{post.sharedPost.content}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-caption text-label-tertiary border-t border-separator pt-2.5">
          <button onClick={handleLike} className={`flex items-center gap-1.5 ${post.isLiked ? "text-red-500" : ""}`}>
            <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} /> {post.likesCount} likes
          </button>
          <span><MessageCircle size={14} className="inline mr-1" />{post.commentsCount} comments</span>
          <span><Share2 size={14} className="inline mr-1" />{post.sharesCount} shares</span>
        </div>
      </div>

      {/* Comments */}
      <h3 className="text-footnote font-semibold text-label-tertiary uppercase tracking-wider mb-3">Comments</h3>

      {post.comments?.length === 0 ? (
        <p className="text-caption text-label-quaternary text-center py-8">No comments yet. Start the conversation!</p>
      ) : (
        <div className="space-y-3 mb-4">
          {post.comments?.map((comment: Comment) => (
            <div key={comment.id} className="card !p-3">
              <div className="flex gap-2.5">
                <Avatar src={comment.author.photoUrl} name={comment.author.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="bg-surface-tertiary rounded-xl px-3 py-2">
                    <p className="text-caption font-semibold text-label-primary">{comment.author.name}</p>
                    <p className="text-caption text-label-secondary">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-[10px] text-label-quaternary">{timeAgo(comment.createdAt)}</span>
                    <button className="text-[10px] font-semibold text-label-tertiary hover:text-accent">Like{comment.likesCount > 0 && ` (${comment.likesCount})`}</button>
                    <button
                      onClick={() => setReplyTo({ id: comment.id, name: comment.author.name })}
                      className="text-[10px] font-semibold text-label-tertiary hover:text-accent"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2 border-l-2 border-separator pl-3">
                      {comment.replies.map((reply: Comment) => (
                        <div key={reply.id} className="flex gap-2">
                          <Avatar src={reply.author.photoUrl} name={reply.author.name} size={24} />
                          <div>
                            <div className="bg-surface-tertiary rounded-lg px-2.5 py-1.5">
                              <p className="text-[11px] font-semibold text-label-primary">{reply.author.name}</p>
                              <p className="text-[11px] text-label-secondary">{reply.content}</p>
                            </div>
                            <span className="text-[9px] text-label-quaternary ml-1">{timeAgo(reply.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                      {(comment._count?.replies || 0) > (comment.replies?.length || 0) && (
                        <button className="text-[10px] text-accent font-medium flex items-center gap-0.5 ml-2">
                          <ChevronDown size={10} /> View more replies
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input - fixed bottom */}
      <div className="fixed bottom-[52px] left-0 right-0 bg-surface-primary border-t border-separator px-4 py-2.5 z-40">
        {replyTo && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-label-tertiary">Replying to <strong>{replyTo.name}</strong></span>
            <button onClick={() => setReplyTo(null)} className="text-[10px] text-red-400 font-medium">Cancel</button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-surface-tertiary rounded-full px-4 py-2 text-caption focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-label-quaternary"
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || submitting}
            className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white disabled:opacity-40 tap-scale"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
