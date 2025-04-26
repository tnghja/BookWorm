import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';import { Button } from './ui/Button';import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SignInForm({  open: controlledOpen, onOpenChange }) {  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const isControlled = controlledOpen !== undefined && onOpenChange;
  const dialogOpen = isControlled ? controlledOpen : isDialogOpen;
  const setDialogOpen = isControlled ? onOpenChange : setIsDialogOpen;

  // Get login function and error state from AuthContext
  const { login, error: authError } = useAuth(); // Assuming clearError exists in your context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Optionally clear previous errors before attempting login

      await login(email, password);

      if (onSuccessfulLogin) {
        onSuccessfulLogin(); // Call optional callback if provided
      }
  };

  useEffect(() => {
    if (authError) {
      setIsDialogOpen(true);
      setEmail('');
      setPassword('');
    }
  }, [authError]);

  const handleOpenChange = (open) => {
    setDialogOpen(open);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Enter your email and password to sign in to your account.
          </DialogDescription>
        </DialogHeader>
        {/* Form remains inside the Dialog Content */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="email-signin" className="block mb-1 font-medium">Email</label> {/* Use unique ID if multiple forms exist */}
            <input
              id="email-signin"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label htmlFor="password-signin" className="block mb-1 font-medium">Password</label> {/* Use unique ID */}
            <input
              id="password-signin"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Display auth error from context */}
          {authError && <div className="text-red-500 text-sm">{authError}</div>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}