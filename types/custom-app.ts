export interface CustomAppContext {
  urls: string[];
  media: string[];
  sources: string[];
}

export interface CustomApp {
  id: string;
  name: string;
  intention: string;
  description: string;
  advancedContext?: CustomAppContext;
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}
