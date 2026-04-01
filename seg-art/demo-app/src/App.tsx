import SegmentArt from './components/SegmentArt';
import { Toaster } from './components/ui/toaster';
import { Scissors } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Scissors className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Segment Art</h1>
              <p className="text-xs text-muted-foreground">Professional Image Segmentation Tool</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <SegmentArt />
      </main>

      <Toaster />
    </div>
  );
}

export default App;
