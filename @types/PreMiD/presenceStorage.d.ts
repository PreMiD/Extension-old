declare type presenceStorage = Array<{
  enabled: boolean;
  metadata: presenceMetadata;
  presence: string;
  tmp?: boolean;
}>;
