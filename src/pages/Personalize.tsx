import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Personalize = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    childName: "",
    gender: "",
    petSpecies: "",
    petName: "",
    city: "",
    favoriteColor: "",
    favoriteFood: "",
    photo: null as File | null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, photo: e.target.files![0] }));
      toast({
        title: "Photo uploaded! ✨",
        description: "Your child's photo has been added to the magic.",
      });
    }
  };

  const handleContinue = () => {
    if (!formData.childName || !formData.gender) {
      toast({
        title: "Missing information",
        description: "Please fill in your child's name and gender to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Store in localStorage for now
    localStorage.setItem("personalizationData", JSON.stringify(formData));
    navigate("/stories");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-md border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            YourFairyTale.ai
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Card className="shadow-2xl border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20">
            <CardTitle className="text-3xl md:text-4xl text-center font-bold">
              ✨ Personalization Form
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Child Details Section */}
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-secondary/30 to-accent/10 border border-primary/10">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Meet Your Hero
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name</Label>
                <Input
                  id="childName"
                  placeholder="Enter the hero's name"
                  value={formData.childName}
                  onChange={(e) => handleInputChange("childName", e.target.value)}
                  className="border-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="border-primary/30">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boy">Boy</SelectItem>
                    <SelectItem value="girl">Girl</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pet Details Section */}
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-accent/10 to-secondary/20 border border-accent/10">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Magical Companion
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="petSpecies">Pet Type</Label>
                  <Input
                    id="petSpecies"
                    placeholder="e.g., cat, dog, rabbit"
                    value={formData.petSpecies}
                    onChange={(e) => handleInputChange("petSpecies", e.target.value)}
                    className="border-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="petName">Pet's Name</Label>
                  <Input
                    id="petName"
                    placeholder="Enter pet's name"
                    value={formData.petName}
                    onChange={(e) => handleInputChange("petName", e.target.value)}
                    className="border-accent/30"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/20 border border-primary/10">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Story Magic
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Hometown</Label>
                  <Input
                    id="city"
                    placeholder="Where does your hero live?"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="border-primary/30"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favoriteColor">Favorite Color</Label>
                    <Input
                      id="favoriteColor"
                      placeholder="e.g., blue, pink"
                      value={formData.favoriteColor}
                      onChange={(e) => handleInputChange("favoriteColor", e.target.value)}
                      className="border-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favoriteFood">Favorite Food</Label>
                    <Input
                      id="favoriteFood"
                      placeholder="e.g., pizza, cookies"
                      value={formData.favoriteFood}
                      onChange={(e) => handleInputChange("favoriteFood", e.target.value)}
                      className="border-primary/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-secondary/40 to-primary/10 border-2 border-dashed border-primary/30">
              <Label htmlFor="photo" className="block text-center mb-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-primary" />
                  <span className="text-lg font-semibold">Upload Photo of Child</span>
                  <span className="text-sm text-muted-foreground">
                    {formData.photo ? formData.photo.name : "Optional - helps bring the magic alive!"}
                  </span>
                </div>
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => document.getElementById("photo")?.click()}
              >
                {formData.photo ? "Change Photo" : "Choose Photo"}
              </Button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="flex-1 border-2 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={handleContinue}
                className="flex-1"
              >
                Continue to Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Personalize;
