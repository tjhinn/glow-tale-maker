import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import { supabase } from "@/integrations/supabase/client";
const Personalize = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    heroName: "",
    gender: "",
    petType: "",
    petName: "",
    city: "",
    favoriteColor: "",
    favoriteFood: "",
    photo: null as File | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose a photo smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      toast({
        title: "Photo uploaded! ✨",
        description: "Your child's photo has been added to the magic."
      });
    }
  };
  const handleContinue = async () => {
    if (!formData.heroName || !formData.gender || !formData.photo) {
      toast({
        title: "Missing information",
        description: "Please fill in your child's name, gender, and upload a photo to continue.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    let originalPhotoUrl = '';
    try {
      // Upload photo if exists
      if (formData.photo) {
        const fileExt = formData.photo.name.split('.').pop();
        const fileName = `original-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;
        const {
          error: uploadError
        } = await supabase.storage.from('hero-photos').upload(filePath, formData.photo);
        if (uploadError) {
          toast({
            title: "Upload failed",
            description: "Failed to upload photo. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('hero-photos').getPublicUrl(filePath);
        originalPhotoUrl = publicUrl;
      }

      // Save personalization data (WITHOUT illustrated character)
      const personalizationData = {
        heroName: formData.heroName,
        gender: formData.gender,
        petType: formData.petType,
        petName: formData.petName,
        favoriteColor: formData.favoriteColor,
        favoriteFood: formData.favoriteFood,
        city: formData.city,
        heroPhotoUrl: originalPhotoUrl
      };
      localStorage.setItem("personalizationData", JSON.stringify(personalizationData));
      toast({
        title: "Perfect! ✨",
        description: "Now let's choose your story!"
      });
      navigate("/stories");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <PageWrapper>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Card className="shadow-2xl border-2 border-primary/20 relative overflow-hidden">
          <SparklesAnimation count={5} className="opacity-40" />
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20 relative">
            <CardTitle className="text-3xl text-center font-heading md:text-5xl">
              Who's our brave little hero?
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Tell us about your child to create their magical adventure
            </p>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Child Details Section */}
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-secondary/30 to-accent/10 border border-primary/10 hover:glow-soft transition-all duration-300">
              <h3 className="font-semibold font-heading flex items-center gap-2 text-2xl">
                <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
                Meet Your Hero
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="heroName">Child's Name</Label>
                <Input id="heroName" placeholder="Enter the hero's name" value={formData.heroName} onChange={e => handleInputChange("heroName", e.target.value)} className="border-primary/30" maxLength={15} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={value => handleInputChange("gender", value)}>
                  <SelectTrigger className="border-primary/30">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boy">Boy</SelectItem>
                    <SelectItem value="girl">Girl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pet Details Section */}
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-accent/10 to-secondary/20 border border-accent/10 hover:glow-soft transition-all duration-300">
              <h3 className="font-semibold font-heading flex items-center gap-2 text-2xl">
                <Sparkles className="w-5 h-5 text-accent animate-sparkle" />
                Magical Companion
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="petType">Pet Type</Label>
                  <Input id="petType" placeholder="e.g., cat, dog, rabbit" value={formData.petType} onChange={e => handleInputChange("petType", e.target.value)} className="border-accent/30" maxLength={15} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="petName">Pet's Name</Label>
                  <Input id="petName" placeholder="Enter pet's name" value={formData.petName} onChange={e => handleInputChange("petName", e.target.value)} className="border-accent/30" maxLength={15} />
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/20 border border-primary/10 hover:glow-soft transition-all duration-300">
              <h3 className="font-semibold font-heading flex items-center gap-2 text-2xl">
                <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
                Story Magic
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Hometown</Label>
                  <Input id="city" placeholder="Where does your hero live?" value={formData.city} onChange={e => handleInputChange("city", e.target.value)} className="border-primary/30" maxLength={15} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favoriteColor">Favorite Color</Label>
                    <Input id="favoriteColor" placeholder="e.g., blue, pink" value={formData.favoriteColor} onChange={e => handleInputChange("favoriteColor", e.target.value)} className="border-primary/30" maxLength={15} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favoriteFood">Favorite Food</Label>
                    <Input id="favoriteFood" placeholder="e.g., pizza, cookies" value={formData.favoriteFood} onChange={e => handleInputChange("favoriteFood", e.target.value)} className="border-primary/30" maxLength={15} />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-secondary/40 to-primary/10 border-2 border-dashed border-primary/30 hover:border-primary/50 hover:glow-primary transition-all duration-300">
              <Label htmlFor="photo" className="block text-center mb-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-primary" />
                  <span className="text-lg font-semibold">Upload Photo of Child <span className="text-destructive">*</span></span>
                  <span className="text-sm text-muted-foreground">
                    {formData.photo ? `✨ ${formData.photo.name}` : "Required - this brings your story to life!"}
                  </span>
                </div>
              </Label>
              <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <Button type="button" variant="outline" className="w-full mt-2 text-2xl" onClick={() => document.getElementById("photo")?.click()}>
                {formData.photo ? "Change Photo" : "Choose Photo"}
              </Button>
              
              {formData.photo && <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/5 px-4 py-2 rounded-full mt-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  {formData.photo.name}
                </div>}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              <Button variant="outline" size="lg" onClick={() => navigate("/")} className="flex-1 text-2xl">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button variant="magical" size="lg" onClick={handleContinue} className="flex-1 group text-2xl" disabled={isLoading}>
                <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
                Continue 
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>;
};
export default Personalize;