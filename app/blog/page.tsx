import React from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '../../lib/blogData';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-12 min-h-screen">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 text-xs font-bold uppercase tracking-widest mb-2">
          Sanctuary Chronicles
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 ">
          The InkHaven Blog
        </h1>
        <p className="text-lg text-slate-600 ">
          Exploring the intersection of privacy, mental health, and digital connection. 
          Deep dives into the philosophy and technology behind your favorite anonymous sanctuary.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {BLOG_POSTS.map((post) => (
          <Link 
            key={post.id} 
            href={`/blog/${post.slug}`}
            className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="h-48 bg-gradient-to-br from-teal-500 via-cyan-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {post.author}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-500 transition-colors">
                {post.title}
              </h2>
              <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                {post.excerpt}
              </p>
              <div className="flex items-center text-teal-500 text-sm font-semibold group-hover:gap-2 transition-all">
                Read Article <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-slate-50 .02] border border-slate-200 rounded-2xl p-8 text-center mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Want to stay updated?
        </h2>
        <p className="text-slate-600 mb-6">
          Follow us on our journey to redefine anonymous communication. 
          New articles are published weekly.
        </p>
        <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
          Follow Chronicles
        </button>
      </div>
    </main>
  );
}
