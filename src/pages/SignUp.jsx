import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, User, Lock, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log("Sign Up Data:", data);
    // Add your signup logic/API call here
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><MessageSquare size={32} /></div>
            <h2 className="card-title text-2xl font-bold">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Full Name</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40"><User size={18} /></div>
                <input 
                  {...register("fullName", { required: "Name is required" })}
                  type="text" placeholder="John Doe" 
                  className={`input input-bordered w-full pl-10 ${errors.fullName ? "input-error" : ""}`} 
                />
              </div>
              {errors.fullName && <span className="text-error text-xs mt-1">{errors.fullName.message}</span>}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40"><Mail size={18} /></div>
                <input 
                  {...register("email", { 
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                  })}
                  type="email" placeholder="you@example.com" 
                  className={`input input-bordered w-full pl-10 ${errors.email ? "input-error" : ""}`} 
                />
              </div>
              {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/40"><Lock size={18} /></div>
                <input 
                  {...register("password", { 
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className={`input input-bordered w-full pl-10 ${errors.password ? "input-error" : ""}`} 
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="text-error text-xs mt-1">{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4">Create Account</button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-base-content/60">Already have an account? <Link hide-link="true" to="/login" className="link link-primary text-sm">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;