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
import { Loader2, ArrowLeft, Plus, Edit, Trash2, BookOpen, Upload, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Story {
  id: string;
  title: string;
  moral: string;
  hero_gender: string;
  illustration_style: string;
  pages: any;
  cover_image_url: string | null;
  page_images: any;
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
    pages: '',
    is_active: true,
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [pageImagePreviews, setPageImagePreviews] = useState<string[]>([]);

  const { data: stories, isLoading } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Story[];
    },
  });

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Cover image must be less than 5MB');
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePageImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 24) {
      toast.error('Maximum 24 page images allowed');
      return;
    }
    if (files.some(f => f.size > 5 * 1024 * 1024)) {
      toast.error('Each page image must be less than 5MB');
      return;
    }
    
    setPageFiles(files);
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setPageImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImages = async (storyId: string): Promise<{ coverUrl: string | null; pageImages: any[] }> => {
    setUploading(true);
    let coverUrl: string | null = null;
    const pageImages: any[] = [];

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

      // Upload page images
      for (let i = 0; i < pageFiles.length; i++) {
        const pagePath = `${storyId}/page-${String(i + 1).padStart(2, '0')}.jpg`;
        const { error: pageError } = await supabase.storage
          .from('story-images')
          .upload(pagePath, pageFiles[i], { upsert: true });
        
        if (pageError) throw pageError;
        pageImages.push({ page: i + 1, image_url: pagePath });
      }

      return { coverUrl, pageImages };
    } finally {
      setUploading(false);
    }
  };

  const createStoryMutation = useMutation({
    mutationFn: async (newStory: any) => {
      // First create the story to get an ID
      const { data: storyData, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: newStory.title,
          moral: newStory.moral,
          hero_gender: newStory.hero_gender,
          illustration_style: newStory.illustration_style,
          pages: JSON.parse(newStory.pages),
          is_active: newStory.is_active,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Upload images if any
      if (coverFile || pageFiles.length > 0) {
        const { coverUrl, pageImages } = await uploadImages(storyData.id);
        
        // Update story with image URLs
        const { error: updateError } = await supabase
          .from('stories')
          .update({
            cover_image_url: coverUrl,
            page_images: pageImages,
          })
          .eq('id', storyData.id);
        
        if (updateError) throw updateError;
      }
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
      let coverUrl = null;
      let pageImages: any[] = [];

      // Upload new images if any
      if (coverFile || pageFiles.length > 0) {
        const uploadResult = await uploadImages(id);
        coverUrl = uploadResult.coverUrl;
        pageImages = uploadResult.pageImages;
      }

      const updateData: any = {
        title: updates.title,
        moral: updates.moral,
        hero_gender: updates.hero_gender,
        illustration_style: updates.illustration_style,
        pages: JSON.parse(updates.pages),
        is_active: updates.is_active,
      };

      if (coverUrl) updateData.cover_image_url = coverUrl;
      if (pageImages.length > 0) updateData.page_images = pageImages;

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
      hero_gender: 'boy',
      illustration_style: 'whimsical_storybook',
      pages: '',
      is_active: true,
    });
    setCoverFile(null);
    setPageFiles([]);
    setCoverPreview('');
    setPageImagePreviews([]);
    setEditingStory(null);
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      moral: story.moral,
      hero_gender: story.hero_gender,
      illustration_style: story.illustration_style,
      pages: JSON.stringify(story.pages, null, 2),
      is_active: story.is_active,
    });
    
    // Set existing image previews
    if (story.cover_image_url) {
      const { data } = supabase.storage.from('story-images').getPublicUrl(story.cover_image_url);
      setCoverPreview(data.publicUrl);
    }
    
    if (story.page_images && Array.isArray(story.page_images)) {
      const previews = story.page_images.map((img: any) => {
        const { data } = supabase.storage.from('story-images').getPublicUrl(img.image_url);
        return data.publicUrl;
      });
      setPageImagePreviews(previews);
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON
    try {
      JSON.parse(formData.pages);
    } catch (error) {
      toast.error('Invalid JSON format in pages');
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
                <h1 className="text-3xl font-bold font-playfair">Story Management</h1>
                <p className="text-muted-foreground mt-1">
                  {stories?.length || 0} total stories
                </p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingStory ? 'Edit Story' : 'Create New Story'}
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
                            <SelectItem value="boy">Boy</SelectItem>
                            <SelectItem value="girl">Girl</SelectItem>
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

                    <div>
                      <Label htmlFor="pages">Pages (JSON Array)</Label>
                      <Textarea
                        id="pages"
                        value={formData.pages}
                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                        placeholder='["Page 1 text...", "Page 2 text..."]'
                        className="font-mono text-sm h-32"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use placeholders: {'{heroName}'}, {'{petName}'}, {'{petType}'}, {'{city}'}
                      </p>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <Label htmlFor="cover">Cover Image</Label>
                      <Input
                        id="cover"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="cursor-pointer"
                      />
                      {coverPreview && (
                        <div className="mt-2 relative inline-block">
                          <img src={coverPreview} alt="Cover preview" className="h-32 rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => {
                              setCoverFile(null);
                              setCoverPreview('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Page Images Upload */}
                    <div>
                      <Label htmlFor="pages-images">Page Images (24 images)</Label>
                      <Input
                        id="pages-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePageImagesUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload exactly 24 images, one for each page
                      </p>
                      {pageImagePreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {pageImagePreviews.map((url, i) => (
                            <div key={i} className="relative">
                              <img src={url} alt={`Page ${i + 1}`} className="h-20 w-full object-cover rounded" />
                              <span className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-1 rounded-tr">
                                P{i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
                        <Badge variant="outline">{story.hero_gender}</Badge>
                        <Badge variant={story.is_active ? 'default' : 'secondary'}>
                          {story.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {story.cover_image_url && (
                    <div className="mb-4">
                      <img
                        src={supabase.storage.from('story-images').getPublicUrl(story.cover_image_url).data.publicUrl}
                        alt={story.title}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Pages: {Array.isArray(story.pages) ? story.pages.length : 0}</p>
                    <p>Images: {story.page_images && Array.isArray(story.page_images) ? story.page_images.length : 0}</p>
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
