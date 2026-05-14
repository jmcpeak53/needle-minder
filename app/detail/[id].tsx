import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DetailAppBarTitle } from "../../src/inventory/components/detail/DetailAppBarTitle";
import { DetailCounter } from "../../src/inventory/components/detail/DetailCounter";
import { DetailHero } from "../../src/inventory/components/detail/DetailHero";
import { DetailHistory } from "../../src/inventory/components/detail/DetailHistory";
import { DetailProjects } from "../../src/inventory/components/detail/DetailProjects";
import { DetailStats } from "../../src/inventory/components/detail/DetailStats";
import { InventoryNotesEditor } from "../../src/inventory/components/InventoryNotesEditor";
import { findMerged } from "../../src/inventory/mergedInventoryView";
import { useCatalog } from "../../src/state/CatalogContext";
import { useInventory } from "../../src/state/InventoryContext";
import { useProjects } from "../../src/state/ProjectsContext";
import { AppBar, AppBarAction } from "../../src/ui/AppBar";
import { KeyboardAwareBody } from "../../src/ui/KeyboardAwareBody";
import { colors, spacing } from "../../src/ui/theme";

export default function DetailScreen() {
  const { id: referenceColorId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inventory, updateInventory, removeInventory, setConditionQuantity } = useInventory();
  const { getReservationsByReferenceColor } = useProjects();
  const { getThreadTypeDisplayName } = useCatalog();

  const merged = useMemo(
    () => (referenceColorId ? findMerged(inventory, referenceColorId) : null),
    [inventory, referenceColorId]
  );

  const [noteDraft, setNoteDraft] = useState("");
  const lastSavedNoteRef = useRef("");
  const latestCommitRef = useRef<() => Promise<void>>(async () => undefined);

  const projectReservations = useMemo(
    () => (merged ? getReservationsByReferenceColor(merged.referenceColorId) : []),
    [getReservationsByReferenceColor, merged]
  );

  const totalReserved = projectReservations[0]?.reserved ?? 0;
  const formattedUpdatedAt = useMemo(
    () => (merged ? formatDate(merged.updatedAt) : ""),
    [merged]
  );

  useEffect(() => {
    const nextNote = merged?.notes ?? "";
    setNoteDraft(nextNote);
    lastSavedNoteRef.current = nextNote;
  }, [merged?.referenceColorId, merged?.notes]);

  const commitNoteIfChanged = useCallback(async () => {
    if (!merged) return;
    if (noteDraft === lastSavedNoteRef.current) return;

    const previousNote = lastSavedNoteRef.current;
    const nextNote = noteDraft;
    lastSavedNoteRef.current = nextNote;

    try {
      const writes: Promise<void>[] = [];
      if (merged.fullItem) {
        writes.push(updateInventory(merged.fullItem.id, { notes: nextNote }));
      }
      if (merged.partialItem) {
        writes.push(updateInventory(merged.partialItem.id, { notes: nextNote }));
      }
      await Promise.all(writes);
    } catch (error) {
      lastSavedNoteRef.current = previousNote;
      Alert.alert(
        "Could not save note",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }, [merged, noteDraft, updateInventory]);

  latestCommitRef.current = commitNoteIfChanged;

  useEffect(() => {
    return () => {
      void latestCommitRef.current();
    };
  }, []);

  const promptRemoveLast = useCallback(() => {
    if (!merged) return;
    Alert.alert(
      "Remove skein?",
      `This is your last ${merged.referenceColor.colorName}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const removals: Promise<void>[] = [];
            if (merged.fullItem) removals.push(removeInventory(merged.fullItem.id));
            if (merged.partialItem) removals.push(removeInventory(merged.partialItem.id));
            await Promise.all(removals);
            router.back();
          }
        }
      ]
    );
  }, [merged, removeInventory, router]);

  const handleFullIncrement = useCallback(async () => {
    if (!merged) return;
    await commitNoteIfChanged();
    await setConditionQuantity(merged.referenceColorId, "full", merged.fullQuantity + 1, {
      favorite: merged.favorite,
      notes: noteDraft || null
    });
  }, [merged, commitNoteIfChanged, setConditionQuantity, noteDraft]);

  const handleFullDecrement = useCallback(async () => {
    if (!merged) return;
    if (merged.fullQuantity <= 0) return;
    await commitNoteIfChanged();

    if (merged.totalQuantity <= 1) {
      promptRemoveLast();
      return;
    }
    await setConditionQuantity(merged.referenceColorId, "full", merged.fullQuantity - 1);
  }, [merged, commitNoteIfChanged, setConditionQuantity, promptRemoveLast]);

  const handlePartialIncrement = useCallback(async () => {
    if (!merged) return;
    await commitNoteIfChanged();
    await setConditionQuantity(merged.referenceColorId, "partial", merged.partialQuantity + 1, {
      favorite: merged.favorite,
      notes: noteDraft || null
    });
  }, [merged, commitNoteIfChanged, setConditionQuantity, noteDraft]);

  const handlePartialDecrement = useCallback(async () => {
    if (!merged) return;
    if (merged.partialQuantity <= 0) return;
    await commitNoteIfChanged();

    if (merged.totalQuantity <= 1) {
      promptRemoveLast();
      return;
    }
    await setConditionQuantity(merged.referenceColorId, "partial", merged.partialQuantity - 1);
  }, [merged, commitNoteIfChanged, setConditionQuantity, promptRemoveLast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!merged) return;
    await commitNoteIfChanged();
    const next = !merged.favorite;
    const writes: Promise<void>[] = [];
    if (merged.fullItem) {
      writes.push(updateInventory(merged.fullItem.id, { favorite: next }));
    }
    if (merged.partialItem) {
      writes.push(updateInventory(merged.partialItem.id, { favorite: next }));
    }
    await Promise.all(writes);
  }, [merged, commitNoteIfChanged, updateInventory]);

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

  const handleRemoveAll = useCallback(() => {
    if (!merged) return;
    Alert.alert(
      "Remove from stash?",
      `${merged.referenceColor.colorName} will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const removals: Promise<void>[] = [];
            if (merged.fullItem) removals.push(removeInventory(merged.fullItem.id));
            if (merged.partialItem) removals.push(removeInventory(merged.partialItem.id));
            await Promise.all(removals);
            router.back();
          }
        }
      ]
    );
  }, [merged, removeInventory, router]);

  if (!merged) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppBar title="Not found" onBack={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppBar
        title={merged.referenceColor.colorName}
        center={
          <DetailAppBarTitle
            code={merged.referenceColor.colorCode}
            name={merged.referenceColor.colorName}
          />
        }
        onBack={() => void handleBack()}
        trailing={<AppBarAction icon="ellipsis-horizontal" onPress={handleRemoveAll} />}
      />

      <KeyboardAwareBody
        testID="detail-keyboard-body"
        scrollTestID="detail-keyboard-scroll"
        contentBottomPadding={24}
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="none"
      >
        <DetailHero
          referenceColor={merged.referenceColor}
          threadTypeDisplayName={getThreadTypeDisplayName(merged.referenceColor.threadTypeId)}
          formattedUpdatedAt={formattedUpdatedAt}
          favorite={merged.favorite}
          onToggleFavorite={() => void handleToggleFavorite()}
        />

        <DetailCounter
          fullQuantity={merged.fullQuantity}
          partialQuantity={merged.partialQuantity}
          onFullDecrement={() => void handleFullDecrement()}
          onFullIncrement={() => void handleFullIncrement()}
          onPartialDecrement={() => void handlePartialDecrement()}
          onPartialIncrement={() => void handlePartialIncrement()}
        />

        <DetailStats inStash={merged.totalQuantity} reserved={totalReserved} />

        <InventoryNotesEditor
          value={noteDraft}
          onChangeText={setNoteDraft}
          onBlur={() => void commitNoteIfChanged()}
        />

        <DetailHistory
          fullQuantity={merged.fullQuantity}
          partialQuantity={merged.partialQuantity}
          formattedUpdatedAt={formattedUpdatedAt}
        />

        <DetailProjects
          reservations={projectReservations}
          onOpenProject={(projectId) => void handleOpenProject(projectId)}
        />
      </KeyboardAwareBody>
    </View>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
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
