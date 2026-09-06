## 2023-10-27 - [Add Focus Ring to File Input]
**Learning:** Hidden file inputs (`<input type="file" className="sr-only">`) inside of labels can completely block keyboard users from knowing when they have focused on the file input mechanism using Tab.
**Action:** Always apply `focus-within` styles to the parent `<label>` wrapping a visually hidden file input so that keyboard focus remains visible to users relying on keyboard navigation.
