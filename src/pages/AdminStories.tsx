import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, BookOpen, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface PageData {
  page: number;
  text: string;
  template_image_url: string;
  image_prompt?: string;
}

interface Story {
  id: string;
  title: string;
  moral: string;
  hero_gender: string;
  illustration_style: string;
  pages: PageData[];
  cover_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminStories = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    moral: '',
    hero_gender: 'boy',
    illustration_style: 'whimsical_storybook',
    is_active: true,
  });

  const [pages, setPages] = useState<Array<{ text: string; image: File | null; imagePrompt: string; imageUrl?: string; existingPath?: string; page: number }>>(
    Array(12).fill(null).map((_, i) => ({ text: '', image: null, imagePrompt: '', page: i + 1 }))
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  const { data: stories, isLoading } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Story[];
    },
  });

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Cover image must be less than 20MB');
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePageImageUpload = (pageIndex: number, file: File | null) => {
    if (file && file.size > 20 * 1024 * 1024) {
      toast.error('Page image must be less than 20MB');
      return;
    }
    
    const newPages = [...pages];
    newPages[pageIndex] = { ...newPages[pageIndex], image: file };
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPages[pageIndex].imageUrl = reader.result as string;
        setPages([...newPages]);
      };
      reader.readAsDataURL(file);
    } else {
      setPages(newPages);
    }
  };

  const updatePageText = (pageIndex: number, text: string) => {
    const newPages = [...pages];
    newPages[pageIndex] = { ...newPages[pageIndex], text };
    setPages(newPages);
  };

  const updatePagePrompt = (pageIndex: number, prompt: string) => {
    const newPages = [...pages];
    newPages[pageIndex] = { ...newPages[pageIndex], imagePrompt: prompt };
    setPages(newPages);
  };

  const uploadImages = async (storyId: string): Promise<{ coverUrl: string | null; pagesData: PageData[] }> => {
    setUploading(true);
    let coverUrl: string | null = null;
    const pagesData: PageData[] = [];

    try {
      // Upload cover image
      if (coverFile) {
        const coverPath = `${storyId}/cover.jpg`;
        const { error: coverError } = await supabase.storage
          .from('story-images')
          .upload(coverPath, coverFile, { upsert: true });
        
        if (coverError) throw coverError;
        coverUrl = coverPath;
      }

      // Upload page images and build pages data
      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i];
        let imageUrl = pageData.existingPath || '';

        if (pageData.image) {
          const pagePath = `${storyId}/page-${String(i + 1).padStart(2, '0')}.jpg`;
          const { error: pageError } = await supabase.storage
            .from('story-images')
            .upload(pagePath, pageData.image, { upsert: true });
          
          if (pageError) throw pageError;
          imageUrl = pagePath;
        }

        pagesData.push({
          page: i + 1,
          text: pageData.text,
          template_image_url: imageUrl,
          image_prompt: pageData.imagePrompt || '',
        } as any);
      }

      return { coverUrl, pagesData };
    } finally {
      setUploading(false);
    }
  };

  const createStoryMutation = useMutation({
    mutationFn: async (newStory: any) => {
      // Validate that all pages have text
      if (pages.some(p => !p.text.trim())) {
        throw new Error('All 12 pages must have text');
      }

      // First create the story to get an ID
      const { data: storyData, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: newStory.title,
          moral: newStory.moral,
          hero_gender: newStory.hero_gender,
          illustration_style: newStory.illustration_style,
          pages: [],
          is_active: newStory.is_active,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Upload images and build pages data
      const { coverUrl, pagesData } = await uploadImages(storyData.id);
      
      // Update story with all data
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          cover_image_url: coverUrl,
          pages: pagesData as any,
        })
        .eq('id', storyData.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story created successfully!');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error('Failed to create story');
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Validate that all pages have text
      if (pages.some(p => !p.text.trim())) {
        throw new Error('All 12 pages must have text');
      }

      // Upload new images if any
      const { coverUrl, pagesData } = await uploadImages(id);

      const updateData: any = {
        title: updates.title,
        moral: updates.moral,
        hero_gender: updates.hero_gender,
        illustration_style: updates.illustration_style,
      pages: pagesData as any,
        is_active: updates.is_active,
      };

      if (coverUrl) updateData.cover_image_url = coverUrl;

      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story updated successfully!');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update story');
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stories'] });
      toast.success('Story deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete story');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      moral: '',
      hero_gender: 'both',
      illustration_style: 'whimsical_storybook',
      is_active: true,
    });
    setPages(Array(12).fill(null).map((_, i) => ({ text: '', image: null, imagePrompt: '', imageUrl: '', existingPath: '', page: i + 1 })));
    setCoverFile(null);
    setCoverPreview('');
    setEditingStory(null);
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      moral: story.moral,
      hero_gender: story.hero_gender,
      illustration_style: story.illustration_style,
      is_active: story.is_active,
    });
    
    // Set existing image previews
    if (story.cover_image_url) {
      const { data } = supabase.storage.from('story-images').getPublicUrl(story.cover_image_url);
      setCoverPreview(`${data.publicUrl}?t=${new Date(story.updated_at).getTime()}`);
    }
    
    // Load existing pages data
    if (story.pages && Array.isArray(story.pages)) {
      const loadedPages = story.pages.map((p: PageData, i) => {
        let imageUrl = '';
        if (p.template_image_url) {
          const { data } = supabase.storage.from('story-images').getPublicUrl(p.template_image_url);
          imageUrl = `${data.publicUrl}?t=${new Date(story.updated_at).getTime()}`;
        }
        return {
          text: p.text,
          image: null,
          imagePrompt: p.image_prompt || '',
          imageUrl,
          existingPath: p.template_image_url || '',
          page: i + 1,
        };
      });
      // Ensure we always have 12 pages
      while (loadedPages.length < 12) {
        loadedPages.push({ text: '', image: null, imagePrompt: '', imageUrl: '', existingPath: '', page: loadedPages.length + 1 });
      }
      setPages(loadedPages);
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all pages have text
    if (pages.some(p => !p.text.trim())) {
      toast.error('All 12 pages must have text content');
      return;
    }

    if (editingStory) {
      updateStoryMutation.mutate({ id: editingStory.id, updates: formData });
    } else {
      createStoryMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStoryMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-wonderia">Story Template Management</h1>
                <p className="text-muted-foreground mt-1">
                  {stories?.length || 0} total story templates
                </p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Story Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingStory ? 'Edit Story Template' : 'Create New Story Template'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Story Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="moral">Moral/Theme</Label>
                      <Input
                        id="moral"
                        value={formData.moral}
                        onChange={(e) => setFormData({ ...formData, moral: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hero_gender">Hero Gender</Label>
                        <Select
                          value={formData.hero_gender}
                          onValueChange={(value) => setFormData({ ...formData, hero_gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boy">Boy Only</SelectItem>
                            <SelectItem value="girl">Girl Only</SelectItem>
                            <SelectItem value="both">Both Genders</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="illustration_style">Illustration Style</Label>
                        <Input
                          id="illustration_style"
                          value={formData.illustration_style}
                          onChange={(e) => setFormData({ ...formData, illustration_style: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Page Editor - 12 Pages */}
                    <div className="space-y-4">
                      <Label>Story Pages (12 pages required)</Label>
                      <p className="text-xs text-muted-foreground">
                        Use placeholders: {'{heroName}'}, {'{petName}'}, {'{petType}'}, {'{city}'}, {'{favoriteColor}'}, {'{favoriteFood}'}
                      </p>
                      <div className="space-y-3">
                        {pages.map((page, index) => (
                          <Card key={index} className="p-3">
                            <div className="grid grid-cols-[28px_1fr_1fr] gap-3 items-start">
                              {/* Page number */}
                              <div className="w-7 h-7 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              
                              {/* Image column - 50% */}
                              <div className="aspect-[4/3] bg-muted/30 rounded border overflow-hidden relative">
                                {(page.imageUrl || page.existingPath) ? (
                                  <>
                                    <img
                                      src={page.imageUrl || page.existingPath}
                                      alt={`Page ${index + 1}`}
                                      className="w-full h-full object-contain"
                                    />
                                    {page.image && (
                                      <Badge className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-primary">
                                        New
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 opacity-50" />
                                  </div>
                                )}
                              </div>

                              {/* Content column - 50% */}
                              <div className="space-y-2 min-w-0">
                                <Textarea
                                  placeholder={`Story text for page ${index + 1}...`}
                                  value={page.text}
                                  onChange={(e) => updatePageText(index, e.target.value)}
                                  className="min-h-32 text-sm"
                                  required
                                />
                                <Input
                                  placeholder="Image prompt..."
                                  value={page.imagePrompt}
                                  onChange={(e) => updatePagePrompt(index, e.target.value)}
                                  className="text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePageImageUpload(index, e.target.files?.[0] || null)}
                                    className="text-xs flex-1"
                                  />
                                  {page.image && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePageImageUpload(index, null)}
                                      className="text-xs h-7"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <Label htmlFor="cover">Cover Image</Label>
                      
                      {/* Current saved cover */}
                      {coverPreview && !coverFile && (
                        <div className="mb-2 p-2 bg-muted/50 rounded border">
                          <p className="text-xs text-muted-foreground mb-1">Current Cover:</p>
                          <div className="aspect-[4/3] w-1/2 bg-muted/20 rounded overflow-hidden">
                            <img 
                              src={coverPreview} 
                              alt="Cover preview" 
                              className="w-full h-full object-contain" 
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload a new file to replace
                          </p>
                        </div>
                      )}
                      
                      {/* New cover preview */}
                      {coverFile && coverPreview && (
                        <div className="mb-2 p-2 bg-primary/10 rounded border border-primary">
                          <div className="flex items-start gap-2">
                            <div>
                              <p className="text-xs text-primary mb-1">New Cover (unsaved):</p>
                              <div className="aspect-[4/3] w-1/2 bg-primary/5 rounded overflow-hidden">
                                <img 
                                  src={coverPreview} 
                                  alt="New cover preview" 
                                  className="w-full h-full object-contain" 
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setCoverFile(null);
                                if (editingStory?.cover_image_url) {
                                  const { data } = supabase.storage.from('story-images').getPublicUrl(editingStory.cover_image_url);
                                  setCoverPreview(`${data.publicUrl}?t=${new Date(editingStory.updated_at).getTime()}`);
                                } else {
                                  setCoverPreview('');
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Input
                        id="cover"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="cursor-pointer"
                      />
                    </div>


                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active (visible to users)</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>{editingStory ? 'Update Story' : 'Create Story'}</>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stories List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories && stories.length === 0 ? (
              <Card className="p-8 text-center col-span-full">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No stories found</p>
              </Card>
            ) : (
              stories?.map((story) => (
                <Card key={story.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{story.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{story.moral}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">
                          {story.hero_gender === 'both' ? '👦👧 Both' : 
                           story.hero_gender === 'boy' ? '👦 Boy' : '👧 Girl'}
                        </Badge>
                        <Badge variant={story.is_active ? 'default' : 'secondary'}>
                          {story.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {story.cover_image_url && (
                    <div className="mb-4 aspect-[4/3] w-full bg-muted/30 rounded-lg overflow-hidden border">
                      <img
                        src={`${supabase.storage.from('story-images').getPublicUrl(story.cover_image_url).data.publicUrl}?t=${new Date(story.updated_at).getTime()}`}
                        alt={story.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Pages: {Array.isArray(story.pages) ? story.pages.length : 0}</p>
                    <p className="text-xs mt-1">Style: {story.illustration_style}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(story)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminStories;
