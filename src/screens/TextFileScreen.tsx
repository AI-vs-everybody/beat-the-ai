export default function TextFileScreen() {
  const [content, setContent] = useState<string>("Loading...");

  useEffect(() => {
    const loadText = async () => {
      try {
        // Load asset (bundled with the app)
        const asset = Asset.fromModule(require("../../assets/texts/story.txt"));
        await asset.downloadAsync();

        // Read it from FileSystem
        const fileUri = asset.localUri || asset.uri;
        const text = await FileSystem.readAsStringAsync(fileUri);

        setContent(text);
      } catch (error) {
        console.error("Error loading text:", error);
        setContent("Failed to load text file.");
      }
    };

    loadText();
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 16, lineHeight: 24 }}>{content}</Text>
    </ScrollView>
  );
}
