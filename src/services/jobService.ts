import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Job } from '../types/job';
import { INITIAL_JOBS } from './seedData';

const JOBS_COLLECTION = 'jobs';

/**
 * Subscribes to published jobs in real-time
 */
export function subscribeToPublishedJobs(
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const jobsRef = collection(db, JOBS_COLLECTION);
  const q = query(
    jobsRef,
    where('status', '==', 'published')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const jobs: Job[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Job));
      
      // Sort newest first in memory to avoid requiring complex composite index on initial setup
      jobs.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
      
      onUpdate(jobs);
    },
    (err) => {
      console.error('Error fetching published jobs:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, JOBS_COLLECTION);
    }
  );
}

/**
 * Subscribes to all jobs for admin dashboard (drafts, published, archived)
 */
export function subscribeToAllJobsForAdmin(
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const jobsRef = collection(db, JOBS_COLLECTION);
  
  return onSnapshot(
    jobsRef,
    (snapshot) => {
      const jobs: Job[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Job));
      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(jobs);
    },
    (err) => {
      console.error('Error fetching admin jobs:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, JOBS_COLLECTION);
    }
  );
}

/**
 * Fetches a single job by its unique slug or ID
 */
export async function getJobBySlug(slug: string): Promise<Job | null> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const q = query(jobsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }

    // Fallback: check if slug is document ID directly
    const directDoc = await getDoc(doc(db, JOBS_COLLECTION, slug));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...directDoc.data() } as Job;
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${JOBS_COLLECTION}/${slug}`);
  }
}

/**
 * Creates a new job in Firestore
 */
export async function createJob(jobData: Omit<Job, 'id'>, customId?: string): Promise<string> {
  const docId = customId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, JOBS_COLLECTION, docId);
  try {
    await setDoc(docRef, {
      ...jobData,
      createdAt: jobData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${JOBS_COLLECTION}/${docId}`);
  }
}

/**
 * Updates an existing job
 */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  const docRef = doc(db, JOBS_COLLECTION, jobId);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${JOBS_COLLECTION}/${jobId}`);
  }
}

/**
 * Deletes a job
 */
export async function deleteJob(jobId: string): Promise<void> {
  const docRef = doc(db, JOBS_COLLECTION, jobId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${JOBS_COLLECTION}/${jobId}`);
  }
}

/**
 * Seeds initial jobs if collection is completely empty
 */
export async function seedInitialJobsIfEmpty(): Promise<boolean> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const snap = await getDocs(query(jobsRef, where('status', '==', 'published')));
    if (snap.empty) {
      console.log('Seeding initial inaquired jobs...');
      for (const job of INITIAL_JOBS) {
        const id = `job_${job.slug}`;
        await setDoc(doc(db, JOBS_COLLECTION, id), {
          ...job,
        });
      }
      return true;
    }
    return false;
  } catch (err) {
    // If permission or initial setup prevented public write, this is expected for unauthenticated users
    console.warn('Initial seeding note: ', err);
    return false;
  }
}
