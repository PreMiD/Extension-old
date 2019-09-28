declare type presenceMetadata = {
  author: {
    id: string;
    name: string;
  };
  category: string;
  color: string;
  description: { [langCode: string]: string };
  logo: string;
  service: string;
  tags: Array<string>;
  url: string;
  version: string;
  regExp?: RegExp | string;
  iFrameRegExp?: RegExp | string;
};
