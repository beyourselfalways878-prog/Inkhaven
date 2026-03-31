import React from 'react';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '../../../lib/blogData';
import { Calendar, User, ArrowLeft, Share2, Bookmark } from 'lucide-react';
import Link from 'next/link';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-6 py-16 space-y-12 min-h-screen">
      <Link 
        href="/blog" 
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-500 transition-colors mb-4 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Chronicles
      </Link>

      <div className="space-y-6">
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-white/30 mb-2 uppercase tracking-widest font-bold font-mono">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5">
            <Calendar size={12} />
            {post.date}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5">
            <User size={12} />
            {post.author}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed border-l-4 border-indigo-500 pl-6">
          {post.excerpt}
        </p>
      </div>

      <div className="h-[400px] w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-90 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl m-1 rounded-[22px] flex items-center justify-center">
            <div className="text-8xl opacity-20 filter grayscale blur-[2px]">InkHaven</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-12 items-start">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          {post.content.map((paragraph, index) => (
            <p key={index} className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left">
              {paragraph}
            </p>
          ))}
        </div>

        <aside className="sticky top-24 space-y-8 hidden lg:block">
          <div className="bg-white dark:bg-obsidian-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Share this Insight</h4>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Share2 size={16} /> Twitter
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Bookmark size={16} /> Save
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-slate-200 dark:border-white/10 pt-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{post.author}</div>
            <div className="text-sm text-slate-500 dark:text-white/40">InkHaven Core Contributor</div>
          </div>
        </div>
        <Link href="/blog" className="px-8 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl">
          More Chronicles
        </Link>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}
