import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Link2,
  MousePointerClick,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { campaignsApi, linksApi } from '../lib/api';
import { Campaign, Link as LinkType } from '../types';
import { formatCompactNumber } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export function CampaignsPage() {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToastStore();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0f9d8a');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampaigns() {
      if (!user) return;
      setIsLoading(true);
      try {
        const camps = await campaignsApi.getCampaigns(user.role === 'admin' ? undefined : user.id);
        setCampaigns(camps);
      } catch {
        toastError('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, [user]);

  function handleOpenCreate() {
    setEditingCamp(null);
    setName('');
    setDescription('');
    setColor('#0f9d8a');
    setModalOpen(true);
  }

  function handleOpenEdit(camp: Campaign) {
    setEditingCamp(camp);
    setName(camp.name);
    setDescription(camp.description || '');
    setColor(camp.color);
    setModalOpen(true);
  }

  async function handleSaveCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;

    try {
      if (editingCamp) {
        const updated = await campaignsApi.updateCampaign(editingCamp.id, {
          name: name.trim(),
          description: description.trim(),
          color,
        });
        setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        success('Campaign updated');
      } else {
        const created = await campaignsApi.createCampaign({
          userId: user.id,
          name: name.trim(),
          description: description.trim(),
          color,
        });
        setCampaigns([...campaigns, created]);
        success('Campaign created');
      }
      setModalOpen(false);
    } catch {
      toastError('Failed to save campaign');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmId) return;
    try {
      await campaignsApi.deleteCampaign(deleteConfirmId);
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      success('Campaign removed');
    } catch {
      toastError('Failed to delete campaign');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campaigns Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Group links into marketing initiatives, product releases, and track consolidated performance
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          <span>New Campaign</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Campaigns Created"
          description="Organize your short links into dedicated marketing funnels or initiatives."
          actionLabel="Create First Campaign"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => (
            <Card key={camp.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: camp.color }}
                    />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {camp.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(camp)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Edit campaign"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(camp.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {camp.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {camp.linksCount || 0}
                    </span>{' '}
                    links
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-sky-600" />
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCompactNumber(camp.clicksCount || 0)}
                    </span>{' '}
                    clicks
                  </span>
                </div>

                <Link
                  to={`/app/links?campaign=${camp.id}`}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <span>Filter links</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Create/Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCamp ? 'Edit Campaign' : 'Create New Campaign'}
          description="Group links under a unified label for analytics tracking"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCampaign}>
                Save Campaign
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <Input
              label="Campaign Name"
              required
              placeholder="e.g. Q4 Global Product Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe the objective or channels used in this campaign..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  {color}
                </span>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? Links attached to it will not be deleted, but will become unassigned."
        confirmLabel="Delete Campaign"
        isDestructive
      />
    </div>
  );
}
