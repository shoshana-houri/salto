/*
*                      Copyright 2020 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import _ from 'lodash'
import { deploy, PlanItem, ItemStatus } from '@salto-io/core'
import { setInterval } from 'timers'
import { logger } from '@salto-io/logging'
import { EOL } from 'os'
import { createCommandBuilder } from '../command_builder'
import {
  CliCommand, CliOutput, ParsedCliInput, WriteStream,
  CliExitCode, SpinnerCreator, CliTelemetry,
} from '../types'
import {
  formatActionStart, formatItemDone,
  formatCancelAction, formatActionInProgress,
  formatItemError, deployPhaseEpilogue,
} from '../formatter'
import { shouldDeploy } from '../callbacks'
import { loadWorkspace, updateWorkspace, getWorkspaceTelemetryTags } from '../workspace'
import { servicesFilter, ServicesArgs } from '../filters/services'
import { getCliTelemetry } from '../telemetry'

const log = logger(module)

const ACTION_INPROGRESS_INTERVAL = 5000

type Action = {
  item: PlanItem
  startTime: Date
  intervalId: ReturnType<typeof setTimeout>
}

export class DeployCommand implements CliCommand {
  readonly stdout: WriteStream
  readonly stderr: WriteStream
  private actions: Map<string, Action>
  private cliTelemetry: CliTelemetry

  constructor(
    private readonly workspaceDir: string,
    readonly force: boolean,
    readonly inputServices: string[],
    cliTelemetry: CliTelemetry,
    { stdout, stderr }: CliOutput,
    private readonly spinnerCreator: SpinnerCreator,
  ) {
    this.stdout = stdout
    this.stderr = stderr
    this.actions = new Map<string, Action>()
    this.cliTelemetry = cliTelemetry
  }

  private endAction(itemName: string): void {
    const action = this.actions.get(itemName)
    if (action) {
      if (action.startTime && action.item) {
        this.stdout.write(formatItemDone(action.item, action.startTime))
      }
      if (action.intervalId) {
        clearInterval(action.intervalId)
      }
    }
  }

  private errorAction(itemName: string, details: string): void {
    const action = this.actions.get(itemName)
    if (action) {
      this.stderr.write(formatItemError(itemName, details))
      if (action.intervalId) {
        clearInterval(action.intervalId)
      }
    }
  }

  private cancelAction(itemName: string, parentItemName: string): void {
    this.stderr.write(formatCancelAction(itemName, parentItemName))
  }

  private startAction(itemName: string, item: PlanItem): void {
    const startTime = new Date()
    const intervalId = setInterval(() => {
      this.stdout.write(formatActionInProgress(itemName, item.parent().action, startTime))
    }, ACTION_INPROGRESS_INTERVAL)
    const action = {
      item,
      startTime,
      intervalId,
    }
    this.actions.set(itemName, action)
    this.stdout.write(formatActionStart(item))
  }

  updateAction(item: PlanItem, status: ItemStatus, details?: string): void {
    const itemName = item.getElementName()
    if (itemName) {
      if (status === 'started') {
        this.startAction(itemName, item)
      } else if (this.actions.has(itemName) && status === 'finished') {
        this.endAction(itemName)
      } else if (this.actions.has(itemName) && status === 'error' && details) {
        this.errorAction(itemName, details)
      } else if (status === 'cancelled' && details) {
        this.cancelAction(itemName, details)
      }
    }
  }

  async execute(): Promise<CliExitCode> {
    log.debug(`running deploy command on '${this.workspaceDir}' [force=${this.force}]`)
    const { workspace, errored } = await loadWorkspace(this.workspaceDir,
      { stderr: this.stderr, stdout: this.stdout }, this.spinnerCreator,
      { force: this.force, printStateRecency: true, recommendStateRecency: true })
    if (errored) {
      this.cliTelemetry.failure()
      return CliExitCode.AppError
    }

    const workspaceTags = await getWorkspaceTelemetryTags(workspace)

    this.cliTelemetry.start(workspaceTags)
    const result = await deploy(
      workspace,
      shouldDeploy(this.stdout, workspace),
      (item: PlanItem, step: ItemStatus, details?: string) =>
        this.updateAction(item, step, details),
      this.inputServices,
      this.force
    )

    const nonErroredActions = [...this.actions.keys()]
      .filter(action => !result.errors.map(error => error.elementId).includes(action))
    this.stdout.write(deployPhaseEpilogue(nonErroredActions.length, result.errors.length))
    this.stdout.write(EOL)

    this.cliTelemetry.actionsSuccess(nonErroredActions.length, workspaceTags)
    this.cliTelemetry.actionsFailure(result.errors.length, workspaceTags)

    let cliExitCode = result.success ? CliExitCode.Success : CliExitCode.AppError
    if (!_.isUndefined(result.changes)) {
      const changes = [...result.changes]
      if (!await updateWorkspace(
        workspace,
        { stderr: this.stderr, stdout: this.stdout },
        changes
      )) {
        cliExitCode = CliExitCode.AppError
      }
    }

    if (cliExitCode === CliExitCode.Success) {
      this.cliTelemetry.success(workspaceTags)
    } else {
      this.cliTelemetry.failure(workspaceTags)
    }

    return cliExitCode
  }
}

type DeployArgs = {
  force: boolean
} & ServicesArgs
type DeployParsedCliInput = ParsedCliInput<DeployArgs>

const deployBuilder = createCommandBuilder({
  options: {
    command: 'deploy',
    description: 'Deploys the current blueprints config to the target services',
    keyed: {
      force: {
        alias: ['f'],
        describe: 'Do not ask for approval before deploying the changes',
        boolean: true,
        default: false,
        demandOption: false,
      },
    },
  },

  filters: [servicesFilter],

  async build(
    input: DeployParsedCliInput,
    output: CliOutput,
    spinnerCreator: SpinnerCreator
  ): Promise<CliCommand> {
    return new DeployCommand(
      '.',
      input.args.force,
      input.args.services,
      getCliTelemetry(input.telemetry, 'deploy'),
      output,
      spinnerCreator,
    )
  },
})

export default deployBuilder
