import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  ExploreState,
  ExploreActions,
  ExploreCatalogue,
  CatalogueDetail,
  CatalogueFilters,
  WordSelection,
  ExploreTranslation,
  CEFR_LEVELS,
} from '@/src/types/catalogue';
import { CEFRLevel, Catalogue } from '@/src/types/language';
import { api } from '@/src/services/api';

/**
 * Initial state for the explore store
 */
const initialState: ExploreState = {
  // Data
  cataloguesByLevel: {
    A1: [],
    A2: [],
    B1: [],
    B2: [],
    C1: [],
  },
  selectedCatalogue: null,
  recommendations: [],
  
  // UI State
  expandedLevels: new Set<CEFRLevel>(),
  isLoading: false,
  isLoadingCatalogue: false,
  error: null,
  
  // Filters
  activeFilters: {},
  searchResults: null,
  
  // Selection
  wordSelection: {
    selectedWords: new Set<string>(),
    selectionsByCategory: new Map<string, Set<string>>(),
    totalSelected: 0,
    lastUpdated: new Date().toISOString(),
  },
  
  // Progress
  userProgress: null,
};

/**
 * Store combining state and actions for explore functionality
 */
type ExploreStore = ExploreState & ExploreActions;

/**
 * Create the explore store with Zustand
 */
export const useExploreStore = create<ExploreStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Data fetching actions
        loadCatalogues: async (filters?: CatalogueFilters) => {
          set({ isLoading: true, error: null });
          
          try {
            const { data } = await api.catalogue.getCatalogues(
              filters?.level, 
              filters?.theme
            );
            
            const cataloguesByLevel: ExploreState['cataloguesByLevel'] = {
              A1: [],
              A2: [],
              B1: [],
              B2: [],
              C1: [],
            };
            
            // Organize catalogues by CEFR level
            data.catalogues.forEach((catalogue: Catalogue) => {
              // Transform base catalogue to explore catalogue
              const exploreCatalogue: ExploreCatalogue = {
                ...catalogue,
                theme: 'general', // Default theme - should come from API
                wordCount: catalogue.total_terms || 0,
                imageHash: '', // Should come from API
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
              };
              
              if (cataloguesByLevel[catalogue.cefr_level]) {
                cataloguesByLevel[catalogue.cefr_level].push(exploreCatalogue);
              }
            });
            
            set({ 
              cataloguesByLevel,
              isLoading: false,
              activeFilters: filters || {},
            });
          } catch (error) {
            console.error('Failed to load catalogues:', error);
            set({ 
              error: 'Failed to load catalogues', 
              isLoading: false 
            });
          }
        },

        loadCatalogueDetail: async (catalogueId: string) => {
          set({ isLoadingCatalogue: true, error: null });
          
          try {
            // Load catalogue basic info
            const { data: catalogueData } = await api.catalogue.getCatalogue(catalogueId);
            
            // Load catalogue translations
            const { data: translationsData } = await api.catalogue.getCatalogueTranslations(catalogueId);
            
            // Transform base catalogue to explore catalogue
            const exploreCatalogue: ExploreCatalogue = {
              ...catalogueData,
              theme: catalogueData.theme || 'general',
              wordCount: catalogueData.total_terms || 0,
              imageHash: catalogueData.image_hash || '',
              createdAt: catalogueData.created_at || new Date().toISOString(),
              updatedAt: catalogueData.updated_at || new Date().toISOString(),
              isActive: catalogueData.is_active !== false,
            };
            
            // Transform translations to explore format
            const exploreTranslations: ExploreTranslation[] = translationsData.translations.map(t => ({
              // Base translation properties
              id: t.id,
              catalogue_id: t.catalogue_id,
              user_id: 'user', // Default user ID
              is_known: false,
              native_term: {
                id: `${t.id}_native`,
                phrase: t.native_word,
                language_id: 'native_lang',
                type_id: 'word',
                audio_hash: t.audio_hash,
                image_hash: t.image_hash,
              },
              study_term: {
                id: `${t.id}_study`,
                phrase: t.study_word,
                language_id: 'study_lang',
                type_id: 'word',
                audio_hash: t.audio_hash,
                image_hash: t.image_hash,
              },
              // Extended explore properties
              nativeWord: t.native_word,
              studyWord: t.study_word,
              nativeDefinition: t.native_definition,
              studyDefinition: t.study_definition,
              imageHash: t.image_hash,
              audioHash: t.audio_hash,
              difficulty: t.difficulty || 1,
              frequency: t.frequency || 1,
              partOfSpeech: t.part_of_speech,
              examples: t.examples?.map(ex => ({
                id: ex.id,
                translationId: ex.translation_id,
                nativeExample: ex.native_example,
                studyExample: ex.study_example,
                context: ex.context,
              })),
              tags: t.tags || [],
              isSelected: false,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            }));
            
            const catalogueDetail: CatalogueDetail = {
              ...exploreCatalogue,
              translations: exploreTranslations,
              selectedCount: 0,
              totalWords: exploreTranslations.length,
            };
            
            set({
              selectedCatalogue: catalogueDetail,
              isLoadingCatalogue: false,
            });
          } catch (error) {
            console.error('Failed to load catalogue detail:', error);
            set({
              error: 'Failed to load catalogue details',
              isLoadingCatalogue: false
            });
          }
        },

        loadRecommendations: async () => {
          try {
            // For now, use simple recommendation logic
            // In a real app, this would call a backend endpoint
            const state = get();
            const allCatalogues = Object.values(state.cataloguesByLevel).flat();
            
            const recommendations = allCatalogues
              .slice(0, 3)
              .map((catalogue, index) => ({
                catalogue,
                reason: index === 0 ? 'Matches your level' : 
                        index === 1 ? 'Popular choice' : 'Recently updated',
                priority: 3 - index,
                estimatedTime: 30 + (index * 15),
              }));
            
            set({ recommendations });
          } catch (error) {
            console.error('Failed to load recommendations:', error);
          }
        },

        // Level management actions
        toggleLevelExpansion: (level: CEFRLevel) => {
          const { expandedLevels } = get();
          const newExpandedLevels = new Set(expandedLevels);
          
          if (newExpandedLevels.has(level)) {
            newExpandedLevels.delete(level);
          } else {
            newExpandedLevels.add(level);
          }
          
          set({ expandedLevels: newExpandedLevels });
        },

        expandLevel: (level: CEFRLevel) => {
          const { expandedLevels } = get();
          const newExpandedLevels = new Set(expandedLevels);
          newExpandedLevels.add(level);
          set({ expandedLevels: newExpandedLevels });
        },

        collapseLevel: (level: CEFRLevel) => {
          const { expandedLevels } = get();
          const newExpandedLevels = new Set(expandedLevels);
          newExpandedLevels.delete(level);
          set({ expandedLevels: newExpandedLevels });
        },

        collapseAllLevels: () => {
          set({ expandedLevels: new Set<CEFRLevel>() });
        },

        // Search and filtering actions
        setFilters: (filters: CatalogueFilters) => {
          set({ activeFilters: filters });
          get().loadCatalogues(filters);
        },

        clearFilters: () => {
          set({ activeFilters: {}, searchResults: null });
          get().loadCatalogues();
        },

        searchCatalogues: (query: string) => {
          const { cataloguesByLevel } = get();
          const allCatalogues = Object.values(cataloguesByLevel).flat();
          
          const filteredCatalogues = allCatalogues.filter(catalogue =>
            catalogue.name.toLowerCase().includes(query.toLowerCase()) ||
            catalogue.description.toLowerCase().includes(query.toLowerCase()) ||
            catalogue.theme.toLowerCase().includes(query.toLowerCase())
          );
          
          const searchResults = {
            catalogues: filteredCatalogues,
            totalCount: allCatalogues.length,
            filteredCount: filteredCatalogues.length,
            appliedFilters: { search: query },
          };
          
          set({ searchResults });
        },

        // Word selection actions
        toggleWordSelection: (translationId: string) => {
          const { wordSelection, selectedCatalogue } = get();
          const newSelectedWords = new Set(wordSelection.selectedWords);
          const newSelectionsByCategory = new Map(wordSelection.selectionsByCategory);
          
          if (newSelectedWords.has(translationId)) {
            newSelectedWords.delete(translationId);
            
            // Remove from category
            if (selectedCatalogue) {
              const categorySet = newSelectionsByCategory.get(selectedCatalogue.id);
              if (categorySet) {
                categorySet.delete(translationId);
                if (categorySet.size === 0) {
                  newSelectionsByCategory.delete(selectedCatalogue.id);
                } else {
                  newSelectionsByCategory.set(selectedCatalogue.id, categorySet);
                }
              }
            }
          } else {
            newSelectedWords.add(translationId);
            
            // Add to category
            if (selectedCatalogue) {
              const categorySet = newSelectionsByCategory.get(selectedCatalogue.id) || new Set<string>();
              categorySet.add(translationId);
              newSelectionsByCategory.set(selectedCatalogue.id, categorySet);
            }
          }
          
          const newWordSelection: WordSelection = {
            selectedWords: newSelectedWords,
            selectionsByCategory: newSelectionsByCategory,
            totalSelected: newSelectedWords.size,
            lastUpdated: new Date().toISOString(),
          };
          
          set({ wordSelection: newWordSelection });
          
          // Update selected catalogue if active
          if (selectedCatalogue) {
            const selectedCount = newSelectionsByCategory.get(selectedCatalogue.id)?.size || 0;
            set({
              selectedCatalogue: {
                ...selectedCatalogue,
                selectedCount,
              },
            });
          }
        },

        selectAllWords: (catalogueId: string) => {
          const { selectedCatalogue, wordSelection } = get();
          
          if (!selectedCatalogue || selectedCatalogue.id !== catalogueId) {
            return;
          }
          
          const newSelectedWords = new Set(wordSelection.selectedWords);
          const newSelectionsByCategory = new Map(wordSelection.selectionsByCategory);
          const catalogueWords = new Set<string>();
          
          selectedCatalogue.translations.forEach(translation => {
            newSelectedWords.add(translation.id);
            catalogueWords.add(translation.id);
          });
          
          newSelectionsByCategory.set(catalogueId, catalogueWords);
          
          const newWordSelection: WordSelection = {
            selectedWords: newSelectedWords,
            selectionsByCategory: newSelectionsByCategory,
            totalSelected: newSelectedWords.size,
            lastUpdated: new Date().toISOString(),
          };
          
          set({ 
            wordSelection: newWordSelection,
            selectedCatalogue: {
              ...selectedCatalogue,
              selectedCount: catalogueWords.size,
            },
          });
        },

        clearWordSelection: (catalogueId?: string) => {
          const { wordSelection, selectedCatalogue } = get();
          
          if (catalogueId) {
            // Clear selection for specific catalogue
            const categoryWords = wordSelection.selectionsByCategory.get(catalogueId);
            if (categoryWords) {
              const newSelectedWords = new Set(wordSelection.selectedWords);
              categoryWords.forEach(wordId => newSelectedWords.delete(wordId));
              
              const newSelectionsByCategory = new Map(wordSelection.selectionsByCategory);
              newSelectionsByCategory.delete(catalogueId);
              
              const newWordSelection: WordSelection = {
                selectedWords: newSelectedWords,
                selectionsByCategory: newSelectionsByCategory,
                totalSelected: newSelectedWords.size,
                lastUpdated: new Date().toISOString(),
              };
              
              set({ wordSelection: newWordSelection });
              
              if (selectedCatalogue && selectedCatalogue.id === catalogueId) {
                set({
                  selectedCatalogue: {
                    ...selectedCatalogue,
                    selectedCount: 0,
                  },
                });
              }
            }
          } else {
            // Clear all selections
            const newWordSelection: WordSelection = {
              selectedWords: new Set<string>(),
              selectionsByCategory: new Map<string, Set<string>>(),
              totalSelected: 0,
              lastUpdated: new Date().toISOString(),
            };
            
            set({ wordSelection: newWordSelection });
            
            if (selectedCatalogue) {
              set({
                selectedCatalogue: {
                  ...selectedCatalogue,
                  selectedCount: 0,
                },
              });
            }
          }
        },

        addWordsToStudy: async (translationIds: string[]) => {
          try {
            // Add selected words to user's study list via API
            for (const translationId of translationIds) {
              await api.practice.addTranslation('user', { translation_id: translationId });
            }
            
            // Success - words added to study list
            console.log(`Added ${translationIds.length} words to study`);
          } catch (error) {
            console.error('Failed to add words to study:', error);
            set({ error: 'Failed to add words to study' });
          }
        },

        removeWordsFromStudy: async (translationIds: string[]) => {
          try {
            // Remove words from user's study list via API
            for (const translationId of translationIds) {
              await api.practice.updateTranslation('user', translationId, false);
            }
            
            console.log(`Removed ${translationIds.length} words from study`);
          } catch (error) {
            console.error('Failed to remove words from study:', error);
            set({ error: 'Failed to remove words from study' });
          }
        },

        // Navigation actions
        selectCatalogue: (catalogue: ExploreCatalogue) => {
          get().loadCatalogueDetail(catalogue.id);
        },

        clearSelectedCatalogue: () => {
          set({ selectedCatalogue: null });
        },

        // State management actions
        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'explore-store',
        partialize: (state) => ({
          // Persist only selection and UI preferences
          expandedLevels: Array.from(state.expandedLevels),
          wordSelection: {
            ...state.wordSelection,
            selectedWords: Array.from(state.wordSelection.selectedWords),
            selectionsByCategory: Array.from(state.wordSelection.selectionsByCategory.entries()).map(
              ([key, value]) => [key, Array.from(value)]
            ),
          },
        }),
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          expandedLevels: new Set(persistedState?.expandedLevels || []),
          wordSelection: persistedState?.wordSelection ? {
            ...persistedState.wordSelection,
            selectedWords: new Set(persistedState.wordSelection.selectedWords || []),
            selectionsByCategory: new Map(
              (persistedState.wordSelection.selectionsByCategory || []).map(
                ([key, value]: [string, string[]]) => [key, new Set(value)]
              )
            ),
          } : currentState.wordSelection,
        }),
      }
    ),
    { name: 'explore-store' }
  )
);

/**
 * Selectors for accessing specific parts of the store
 */
export const useExploreData = () => useExploreStore((state) => ({
  cataloguesByLevel: state.cataloguesByLevel,
  selectedCatalogue: state.selectedCatalogue,
  recommendations: state.recommendations,
}));

export const useExploreUI = () => useExploreStore((state) => ({
  expandedLevels: state.expandedLevels,
  isLoading: state.isLoading,
  isLoadingCatalogue: state.isLoadingCatalogue,
  error: state.error,
}));

export const useExploreFilters = () => useExploreStore((state) => ({
  activeFilters: state.activeFilters,
  searchResults: state.searchResults,
}));

export const useWordSelection = () => useExploreStore((state) => ({
  wordSelection: state.wordSelection,
  toggleWordSelection: state.toggleWordSelection,
  selectAllWords: state.selectAllWords,
  clearWordSelection: state.clearWordSelection,
}));

export const useExploreActions = () => useExploreStore((state) => ({
  loadCatalogues: state.loadCatalogues,
  loadCatalogueDetail: state.loadCatalogueDetail,
  loadRecommendations: state.loadRecommendations,
  toggleLevelExpansion: state.toggleLevelExpansion,
  expandLevel: state.expandLevel,
  collapseLevel: state.collapseLevel,
  collapseAllLevels: state.collapseAllLevels,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  searchCatalogues: state.searchCatalogues,
  selectCatalogue: state.selectCatalogue,
  clearSelectedCatalogue: state.clearSelectedCatalogue,
  addWordsToStudy: state.addWordsToStudy,
  removeWordsFromStudy: state.removeWordsFromStudy,
  clearError: state.clearError,
  reset: state.reset,
}));

export default useExploreStore;