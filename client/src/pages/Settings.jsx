import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  ShieldCheck, 
  Users, 
  Plus, 
  Trash2, 
  Lock, 
  Mail, 
  LogOut,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Auth/Info from localStorage
  const adminInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("rw_admin_info") || "{}");
    } catch {
      return {};
    }
  })();
  const isAdmin = adminInfo.role === "admin";

  // --- Queries ---
  
  // 1. Current Profile
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getProfile.url);
      return response.data;
    },
  });

  // 2. Staff List (Admin Only)
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getStaff.url);
      return response.data;
    },
    enabled: isAdmin,
  });

  // --- Mutations ---

  // Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      let payload = { ...data };
      if (payload.logo instanceof File) {
        payload.logo = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(payload.logo);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      }
      const response = await AxiosAdmin.put(SummaryApi.updateProfile.url, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries(["profile"]);
      // Update local storage too
      const updated = { ...adminInfo, ...data };
      localStorage.setItem("rw_admin_info", JSON.stringify(updated));
    },
  });

  // Change Password
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await AxiosAdmin.put(SummaryApi.changePassword.url, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to change password");
    },
  });

  // Register Staff
  const registerStaffMutation = useMutation({
    mutationFn: async (data) => {
      const response = await AxiosAdmin.post(SummaryApi.registerStaff.url, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("New staff added!");
      queryClient.invalidateQueries(["staff"]);
      setAddStaffOpen(false);
    },
  });

  // --- Form States ---
  const [passData, setPassData] = useState({ currentPassword: "", newPassword: "" });
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "cashier" });
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  // Initialize profile form when data loads
  useEffect(() => {
    if (profile) setProfileData({ 
      name: profile.name || "", 
      email: profile.email || "", 
      location: profile.location || "", 
      description: profile.description || "", 
      logo: profile.logo || "" 
    });
  }, [profile]);

  const handleLogout = () => {
    localStorage.removeItem("resto_auth_token");
    localStorage.removeItem("rw_admin_info");
    window.location.reload();
  };

  if (loadingProfile) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card shadow-soft mb-6 p-1 h-auto flex flex-wrap gap-1">
          <TabsTrigger value="profile" className="gap-2 px-4 py-2">
            <User className="h-4 w-4" /> My Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 px-4 py-2">
            <ShieldCheck className="h-4 w-4" /> Security
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team" className="gap-2 px-4 py-2">
              <Users className="h-4 w-4" /> Team Management
            </TabsTrigger>

          )}
          <TabsTrigger value="website" className="gap-2 px-4 py-2">
            <User className="h-4 w-4" /> Website Settings
          </TabsTrigger>
        </TabsList>

        {/* --- Profile Tab --- */}
        <TabsContent value="profile">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-accent flex items-center justify-center text-white text-2xl font-bold shadow-glow">
                {profile?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">{profile?.name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </div>

            <div className="grid gap-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input 
                  value={profileData.email} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => updateProfileMutation.mutate(profileData)}
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- Security Tab --- */}
        <TabsContent value="security">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" /> Change Password
            </h3>
            <div className="grid gap-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input 
                  type="password" 
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  value={passData.newPassword}
                  onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                />
                <p className="text-[11px] text-muted-foreground">Min. 6 characters</p>
              </div>
              <Button 
                onClick={() => changePasswordMutation.mutate(passData)}
                disabled={changePasswordMutation.isPending || passData.newPassword.length < 6}
                className="bg-accent text-accent-foreground shadow-glow w-fit"
              >
                Update Password
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- Team Management Tab --- */}
        {isAdmin && (
          <TabsContent value="team">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-primary">Team Members</h3>
                  <p className="text-xs text-muted-foreground">Manage your restaurant staff and their roles</p>
                </div>
                
                <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-accent text-accent-foreground font-bold shadow-glow">
                      <Plus className="h-4 w-4 mr-2" /> Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Register New Employee</DialogTitle>
                      <DialogDescription>Create a new account for your staff member.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                      <div className="space-y-1.5">
                        <Label>Full Name</Label>
                        <Input 
                          placeholder="John Doe" 
                          value={newStaff.name}
                          onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Temporary Password</Label>
                        <Input 
                          type="password" 
                          value={newStaff.password}
                          onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Role</Label>
                        <select 
                          className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newStaff.role}
                          onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                        >
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => registerStaffMutation.mutate(newStaff)}
                        disabled={registerStaffMutation.isPending || !newStaff.name || !newStaff.email}
                        className="w-full bg-accent text-accent-foreground"
                      >
                        {registerStaffMutation.isPending ? "Adding..." : "Confirm & Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {staff.map((s) => (
                  <div key={s._id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary-soft text-secondary flex items-center justify-center font-bold">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{s.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {s.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                        {s.role}
                      </span>
                      {s.email !== adminInfo.email && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

        )}
         {/* --- Profile Tab --- */}
        <TabsContent value="website">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Restaurant Name</Label>
                <Input 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label>Restaurant Location</Label>
                <Input 
                  value={profileData.location} 
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Restaurant Description</Label>
                <Textarea 
                  value={profileData.description} 
                  onChange={(e) => setProfileData({...profileData, description: e.target.value})} 
                  rows={5}
                />
              </div>
               <div className="space-y-1.5">
                <Label>Restaurant Logo</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfileData({...profileData, logo: e.target.files[0]});
                    }
                  }} 
                />
                {profileData.logo && (
                  <img 
                    src={profileData.logo instanceof File ? URL.createObjectURL(profileData.logo) : profileData.logo} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => updateProfileMutation.mutate(profileData)}
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
