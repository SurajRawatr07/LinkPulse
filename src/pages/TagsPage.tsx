import React, { useState, useEffect } from 'react';
import { Tags as TagsIcon, Plus, Trash2, Tag as TagIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { tagsApi } from '../lib/api';
import { Tag } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

export function TagsPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();

  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#0f9d8a');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTags() {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await tagsApi.getTags(user.role === 'admin' ? undefined : user.id);
        setTags(data);
      } catch {
        toastError('Failed to load tags');
      } finally {
        setIsLoading(false);
      }
    }
    loadTags();
  }, [user]);

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim() || !user) return;
    try {
      const created = await tagsApi.createTag(newTagName.trim(), newTagColor, user.id);
      if (!tags.some((t) => t.id === created.id)) {
        setTags([...tags, created]);
      }
      setNewTagName('');
      success('Tag created');
    } catch {
      toastError('Failed to create tag');
    }
  }

  async function handleDeleteTag(id: string) {
    try {
      await tagsApi.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      success('Tag deleted');
    } catch {
      toastError('Failed to delete tag');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tags Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Categorize and segment short links across multiple channels and content types
        </p>
      </div>

      {/* Create New Tag */}
      <Card className="p-4 sm:p-5">
        <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Input
              label="Tag Label"
              placeholder="e.g. Social, Paid Ads, Documentation"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Color
              </label>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="h-9.5">
              <Plus className="w-4 h-4 mr-1" />
              <span>Add Tag</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Tags List */}
      <Card className="p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          Existing Workspace Tags ({tags.length})
        </h3>

        {tags.length === 0 ? (
          <EmptyState
            icon={TagsIcon}
            title="No Tags"
            description="Create your first tag to start labeling and filtering links."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {tag.name}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete tag"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
