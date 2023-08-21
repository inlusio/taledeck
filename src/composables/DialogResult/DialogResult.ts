import DialogResultCommand from '@/components/DialogResultCommand/DialogResultCommand.vue'
import DialogResultEnd from '@/components/DialogResultEnd/DialogResultEnd.vue'
import DialogResultOptionList from '@/components/DialogResultOptionList/DialogResultOptionList.vue'
import DialogResultText from '@/components/DialogResultText/DialogResultText.vue'
import { DialogCharacter } from '@/models/DialogCharacter/DialogCharacter'
import type { DialogResultContentData, DialogResultMarkup } from '@/models/DialogResult/DialogResult'
import { DialogResultType } from '@/models/DialogResult/DialogResult'
import { DialogResultTextFacet } from '@/models/DialogResultTextFacet/DialogResultTextFacet'
import type { Result } from 'yarn-bound/src'
import YarnBound from 'yarn-bound/src'

const { TextResult, OptionsResult, CommandResult } = YarnBound

export default function useDialogResult() {
  const getCharacter = (markup: Array<DialogResultMarkup>): string | undefined => {
    const name = markup.find(({ name }) => name === 'character')

    if (name) {
      return name.properties.name
    }

    return undefined
  }

  const getResultType = (result: Result | undefined) => {
    switch (true) {
      case result instanceof TextResult:
        return DialogResultType.Text
      case result instanceof OptionsResult:
        return DialogResultType.Options
      case result instanceof CommandResult:
        return DialogResultType.Command
      case result === undefined:
        return DialogResultType.End
      default:
        throw new Error('Unknown Yarn result type!')
    }
  }

  const getResultComponent = (result: Result | undefined): string => {
    switch (true) {
      case result instanceof TextResult:
        return DialogResultText as unknown as string
      case result instanceof OptionsResult:
        return DialogResultOptionList as unknown as string
      case result instanceof CommandResult:
        return DialogResultCommand as unknown as string
      case result === undefined:
        return DialogResultEnd as unknown as string
      default:
        throw new Error('Unknown Yarn result type!')
    }
  }

  const getResultFacets = (textResult: DialogResultContentData): Array<string> => {
    const result: Array<string> = []
    const charName = getCharacter(textResult.markup)
    const [char] = Object.entries(DialogCharacter).find(([_key, value]) => value === charName) ?? []

    if (char) {
      result.push(DialogResultTextFacet[char as keyof typeof DialogResultTextFacet])
    }

    textResult.hashtags
      .filter((hashtag) => Object.keys(DialogResultTextFacet).includes(hashtag))
      .map((hashtag) => DialogResultTextFacet[hashtag as keyof typeof DialogResultTextFacet])
      .forEach((facet) => result.push(facet))

    return result
  }

  return {
    getCharacter,
    getResultType,
    getResultComponent,
    getResultFacets,
  }
}
