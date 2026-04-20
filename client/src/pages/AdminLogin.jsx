import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await AxiosAdmin.post(SummaryApi.adminLogin.url, data);

      if (response.data.success) {
        localStorage.setItem("resto_auth_token", response.data.token);
        localStorage.setItem("rw_admin_info", JSON.stringify(response.data));
        toast.success("Login successful! Welcome back.");
        navigate("/");
        window.location.reload(); // To refresh protected state
      } else {
        toast.error(response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 animate-pulse-slow"
        style={{ 
          backgroundImage: "url('/login-bg.png')",
          filter: "brightness(0.3) blur(2px)"
        }}
      />
      
      {/* Animated gradients for background flair */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-pulse transition-all duration-3000" />

      <Card className="w-full max-w-md mx-4 z-10 bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary rounded-full flex items-center justify-center border-4 border-slate-950 shadow-xl">
             <Lock className="w-10 h-10 text-white" />
        </div>

        <CardHeader className="pt-14 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
          <CardDescription className="text-slate-300">
            Secure access for RestoOS Management
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="admin@example.com" 
                          {...field} 
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 transition-all font-medium"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Access Dashboard"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <div className="p-6 pt-0 text-center">
            <p className="text-sm text-slate-400">
                Unauthorized access is strictly prohibited.
            </p>
        </div>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 20s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default AdminLogin;
