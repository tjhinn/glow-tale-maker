const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface CoverGenerationResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  personalizedCoverUrl?: string;
  errorMessage?: string;
}

interface StartGenerationParams {
  heroPhotoUrl: string;
  coverImageUrl: string;
  personalizedTitle: string;
  petType?: string;
  petName?: string;
  favoriteColor?: string;
  illustrationStyle?: string;
  heroGender?: string;
  storyTheme?: string;
}

export async function startCoverGeneration(params: StartGenerationParams): Promise<string> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-character-illustration`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to start generation: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.jobId) {
    throw new Error('No job ID returned from generation service');
  }

  return data.jobId;
}

export async function checkCoverStatus(jobId: string): Promise<CoverGenerationResult> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check-cover-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ jobId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to check status: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    status: data.status,
    personalizedCoverUrl: data.personalizedCoverUrl,
    errorMessage: data.errorMessage,
  };
}

interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
  onStatusChange?: (status: string) => void;
}

export async function pollForCoverCompletion(
  jobId: string,
  options: PollOptions = {}
): Promise<CoverGenerationResult> {
  const { 
    maxAttempts = 60, // 60 * 3s = 3 minutes max
    intervalMs = 3000,
    onStatusChange
  } = options;

  let attempts = 0;
  let lastStatus = '';

  while (attempts < maxAttempts) {
    const result = await checkCoverStatus(jobId);
    
    if (result.status !== lastStatus) {
      lastStatus = result.status;
      onStatusChange?.(result.status);
    }

    if (result.status === 'completed') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error(result.errorMessage || 'Cover generation failed');
    }

    // Still pending or processing, wait and try again
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('Cover generation timed out. Please try again.');
}
