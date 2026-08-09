// Every surface that names a category is a way into that category's detail
// overlay — a budget row, a Forecast nudge. One route, written once, so a new
// surface can't quietly open somewhere else.

import { useRouter } from 'expo-router';

/** Opens a category's detail overlay over whatever screen called it. */
export function useOpenCategory(): (categoryId: string) => void {
  const router = useRouter();
  return (categoryId) => router.push({ pathname: '/category/[id]', params: { id: categoryId } });
}
