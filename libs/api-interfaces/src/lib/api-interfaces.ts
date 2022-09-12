export interface Message {
  message: string;
}

export interface ItemBase {
  audience: 0;
  duration: string;
  hash: string;
  khash: string;
  id: string;
  location: string;
  mtime: number;
  name: string;
  size: number;
  thumb: string;
  url: string;
}

export interface TopicBase {
  audience: number;
  count: number;
  id: string;
  isLeaf: boolean;
  isVideo: boolean;
  items: ItemBase[];
  name: string;
  pid: string;
  url: string;
}

export interface Breadcrumb {
  level: number;
  name: string;
  topicId: string;
}

export interface TopicCategory {
  audience: 0;
  breadcrumb: Breadcrumb[];
  count: number;
  id: string;
  isLeaf: boolean;
  isVideo: boolean;
  children: TopicBase[];
  name: string;
  pid: string;
  url: string;
}

export interface ItemCategory {
  audience: 0;
  breadcrumb: Breadcrumb[];
  count: number;
  id: string;
  isLeaf: boolean;
  isVideo: boolean;
  children: ItemBase[];
  name: string;
  pid: string;
  url: string;
}
