import { useRequest } from "ahooks";
import { alovaInstance } from "~/utils/request";
import { 
  UserTopWordsResponse, 
  UserTopLemmasResponse, 
  GlobalTopWordsResponse, 
  GlobalTopLemmasResponse,
  PeriodType 
} from "~/types/vocabulary";

// Hook for fetching user's top words
export const useUserTopWords = (period: PeriodType = 'week', limit: number = 10) => {
  return useRequest(
    async () => {
      const response = await alovaInstance.Get<UserTopWordsResponse>('/api/words/stats/user/top-words', {
        params: { period, limit }
      });
      return response;
    },
    {
      onError: (error) => {
        console.error("Failed to fetch user top words:", error);
      }
    }
  );
};

// Hook for fetching user's top lemmas
export const useUserTopLemmas = (period: PeriodType = 'week', limit: number = 10) => {
  return useRequest(
    async () => {
      const response = await alovaInstance.Get<UserTopLemmasResponse>('/api/words/stats/user/top-lemmas', {
        params: { period, limit }
      });
      return response;
    },
    {
      onError: (error) => {
        console.error("Failed to fetch user top lemmas:", error);
      }
    }
  );
};

// Hook for fetching global top words
export const useGlobalTopWords = (period: PeriodType = 'week', limit: number = 10) => {
  return useRequest(
    async () => {
      const response = await alovaInstance.Get<GlobalTopWordsResponse>('/api/words/stats/global/top-words', {
        params: { period, limit }
      });
      return response;
    },
    {
      onError: (error) => {
        console.error("Failed to fetch global top words:", error);
      }
    }
  );
};

// Hook for fetching global top lemmas
export const useGlobalTopLemmas = (period: PeriodType = 'week', limit: number = 10) => {
  return useRequest(
    async () => {
      const response = await alovaInstance.Get<GlobalTopLemmasResponse>('/api/words/stats/global/top-lemmas', {
        params: { period, limit }
      });
      return response;
    },
    {
      onError: (error) => {
        console.error("Failed to fetch global top lemmas:", error);
      }
    }
  );
};