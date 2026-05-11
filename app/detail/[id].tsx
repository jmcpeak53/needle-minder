import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DetailAppBarTitle } from "../../src/inventory/components/detail/DetailAppBarTitle";
import { DetailCounter } from "../../src/inventory/components/detail/DetailCounter";
import { DetailHero } from "../../src/inventory/components/detail/DetailHero";
import { DetailHistory } from "../../src/inventory/components/detail/DetailHistory";
import { DetailProjects } from "../../src/inventory/components/detail/DetailProjects";
import { InventoryNotesEditor } from "../../src/inventory/components/InventoryNotesEditor";
import { useCatalog } from "../../src/state/CatalogContext";
import { useInventory } from "../../src/state/InventoryContext";
import { useProjects } from "../../src/state/ProjectsContext";
import { AppBar, AppBarAction } from "../../src/ui/AppBar";
import { KeyboardAwareBody } from "../../src/ui/KeyboardAwareBody";
import { colors, spacing } from "../../src/ui/theme";

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inventory, decrementInventory, updateInventory, toggleFavorite, removeInventory } = useInventory();
  const { getReservationsByReferenceColor } = useProjects();
  const { getThreadTypeDisplayName } = useCatalog();

  const item = useMemo(() => inventory.find((inventoryItem) => inventoryItem.id === id) ?? null, [inventory, id]);
  const [noteDraft, setNoteDraft] = useState("");
  const lastSavedNoteRef = useRef("");
  const latestCommitRef = useRef<() => Promise<void>>(async () => undefined);
  const projectReservations = useMemo(
    () => (item ? getReservationsByReferenceColor(item.referenceColor.id) : []),
    [getReservationsByReferenceColor, item]
  );
  const formattedUpdatedAt = useMemo(() => (item ? formatDate(item.updatedAt) : ""), [item]);

  useEffect(() => {
    const nextNote = item?.notes ?? "";
    setNoteDraft(nextNote);
    lastSavedNoteRef.current = nextNote;
  }, [item?.id, item?.notes]);

  const commitNoteIfChanged = useCallback(async () => {
    if (!item) return;
    if (noteDraft === lastSavedNoteRef.current) return;

    const previousNote = lastSavedNoteRef.current;
    const nextNote = noteDraft;
    lastSavedNoteRef.current = nextNote;

    try {
      await updateInventory(item.id, { notes: nextNote });
    } catch (error) {
      lastSavedNoteRef.current = previousNote;
      Alert.alert("Could not save note", error instanceof Error ? error.message : "Please try again.");
    }
  }, [item, noteDraft, updateInventory]);

  latestCommitRef.current = commitNoteIfChanged;

  useEffect(() => {
    return () => {
      void latestCommitRef.current();
    };
  }, []);

  const handleDecrement = useCallback(async () => {
    if (!item) return;
    await commitNoteIfChanged();

    if (item.quantity <= 1) {
      Alert.alert("Remove skein?", `This is your last ${item.referenceColor.colorName}.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeInventory(item.id);
            router.back();
          }
        }
      ]);
      return;
    }

    await decrementInventory(item.id);
  }, [item, commitNoteIfChanged, decrementInventory, removeInventory, router]);

  const handleIncrement = useCallback(async () => {
    if (!item) return;
    await commitNoteIfChanged();
    await updateInventory(item.id, { quantity: item.quantity + 1 });
  }, [item, commitNoteIfChanged, updateInventory]);

  const handleToggleFavorite = useCallback(async () => {
    if (!item) return;
    await commitNoteIfChanged();
    await toggleFavorite(item.id);
  }, [item, commitNoteIfChanged, toggleFavorite]);

  const handleBack = useCallback(async () => {
    await commitNoteIfChanged();
    router.back();
  }, [commitNoteIfChanged, router]);

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      await commitNoteIfChanged();
      router.push(`/project/${projectId}`);
    },
    [commitNoteIfChanged, router]
  );

  if (!item) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppBar title="Not found" onBack={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppBar
        title={item.referenceColor.colorName}
        center={<DetailAppBarTitle code={item.referenceColor.colorCode} name={item.referenceColor.colorName} />}
        onBack={() => void handleBack()}
        trailing={
          <AppBarAction
            icon="ellipsis-horizontal"
            onPress={() =>
              Alert.alert("Remove from stash?", `${item.referenceColor.colorName} will be deleted.`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: async () => {
                    await removeInventory(item.id);
                    router.back();
                  }
                }
              ])
            }
          />
        }
      />

      <KeyboardAwareBody
        testID="detail-keyboard-body"
        scrollTestID="detail-keyboard-scroll"
        contentBottomPadding={24}
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="none"
      >
        <DetailHero
          item={item}
          threadTypeDisplayName={getThreadTypeDisplayName(item.referenceColor.threadTypeId)}
          formattedUpdatedAt={formattedUpdatedAt}
          onToggleFavorite={() => void handleToggleFavorite()}
        />

        <DetailCounter
          quantity={item.quantity}
          onDecrement={() => void handleDecrement()}
          onIncrement={() => void handleIncrement()}
        />

        <InventoryNotesEditor
          value={noteDraft}
          onChangeText={setNoteDraft}
          onBlur={() => void commitNoteIfChanged()}
        />

        <DetailHistory item={item} formattedUpdatedAt={formattedUpdatedAt} />

        <DetailProjects
          reservations={projectReservations}
          onOpenProject={(projectId) => void handleOpenProject(projectId)}
        />
      </KeyboardAwareBody>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  scroll: {
    paddingHorizontal: spacing.lg
  }
});
