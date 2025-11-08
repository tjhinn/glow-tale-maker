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
import { Loader2, ArrowLeft, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Story {
  id: string;
  title: string;
  moral: string;
  hero_gender: string;
  illustration_style: string;
  pages: any;
  image_prompts: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminStories = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    moral: '',
    hero_gender: 'boy',
    illustration_style: 'whimsical_storybook',
    pages: '',
    image_prompts: '',
    is_active: true,
  });

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

  const createStoryMutation = useMutation({
    mutationFn: async (newStory: any) => {
      const { error } = await supabase.from('stories').insert({
        title: newStory.title,
        moral: newStory.moral,
        hero_gender: newStory.hero_gender,
        illustration_style: newStory.illustration_style,
        pages: JSON.parse(newStory.pages),
        image_prompts: JSON.parse(newStory.image_prompts),
        is_active: newStory.is_active,
      });
      if (error) throw error;
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
      const { error } = await supabase
        .from('stories')
        .update({
          title: updates.title,
          moral: updates.moral,
          hero_gender: updates.hero_gender,
          illustration_style: updates.illustration_style,
          pages: JSON.parse(updates.pages),
          image_prompts: JSON.parse(updates.image_prompts),
          is_active: updates.is_active,
        })
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
      image_prompts: '',
      is_active: true,
    });
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
      image_prompts: JSON.stringify(story.image_prompts, null, 2),
      is_active: story.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON
    try {
      JSON.parse(formData.pages);
      JSON.parse(formData.image_prompts);
    } catch (error) {
      toast.error('Invalid JSON format in pages or image prompts');
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

                    <div>
                      <Label htmlFor="image_prompts">Image Prompts (JSON Array)</Label>
                      <Textarea
                        id="image_prompts"
                        value={formData.image_prompts}
                        onChange={(e) => setFormData({ ...formData, image_prompts: e.target.value })}
                        placeholder='["Spread 1 prompt...", "Spread 2 prompt..."]'
                        className="font-mono text-sm h-32"
                        required
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
                      <Button type="submit">
                        {editingStory ? 'Update Story' : 'Create Story'}
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

                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Pages: {Array.isArray(story.pages) ? story.pages.length : 0}</p>
                    <p>Prompts: {Array.isArray(story.image_prompts) ? story.image_prompts.length : 0}</p>
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
