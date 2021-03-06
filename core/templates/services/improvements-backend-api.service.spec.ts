// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the ImprovementsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { HighBounceRateTaskObjectFactory, HighBounceRateTask } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import {
  ExplorationImprovementsHistoryResponse,
  ExplorationImprovementsResponse,
  ImprovementsBackendApiService,
  IExplorationImprovementsResponseBackendDict,
  IExplorationImprovementsHistoryResponseBackendDict
} from 'services/improvements-backend-api.service';
import { ITaskEntryBackendDict } from
  'domain/improvements/TaskEntryObjectFactory';

describe('Exploration stats backend api service', () => {
  let highBounceRateTaskObjectFactory: HighBounceRateTaskObjectFactory;
  let httpTestingController: HttpTestingController;
  let improvementsBackendApiService: ImprovementsBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
    highBounceRateTaskObjectFactory = (
      TestBed.get(HighBounceRateTaskObjectFactory));
    improvementsBackendApiService = TestBed.get(ImprovementsBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return an ExplorationImprovementsResponse', fakeAsync(async() => {
    const taskDict: ITaskEntryBackendDict = {
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolver_profile_picture_data_url: './image.png',
      resolved_on_msecs: 123456789,
    };

    const response = improvementsBackendApiService.getTasksAsync('eid');

    const req = (
      httpTestingController.expectOne('/improvements/exploration/eid'));
    expect(req.request.method).toEqual('GET');
    req.flush(<IExplorationImprovementsResponseBackendDict>{
      open_tasks: [taskDict],
      resolved_task_types_by_state_name: {Introduction: ['high_bounce_rate']},
    });
    flushMicrotasks();

    expect(await response).toEqual(
      new ExplorationImprovementsResponse(
        [highBounceRateTaskObjectFactory.createFromBackendDict(taskDict)],
        new Map([['Introduction', ['high_bounce_rate']]])));
  }));

  it('should return an ExplorationImprovementsHistoryResponse',
    fakeAsync(async() => {
      const taskDict: ITaskEntryBackendDict = {
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'high_bounce_rate',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '20% of learners dropped at this state',
        status: 'resolved',
        resolver_username: 'test_user',
        resolver_profile_picture_data_url: './image.png',
        resolved_on_msecs: 123456789,
      };

      const response = improvementsBackendApiService.getHistoryPageAsync('eid');

      const req = httpTestingController.expectOne(
        '/improvements/history/exploration/eid');
      expect(req.request.method).toEqual('GET');
      req.flush(<IExplorationImprovementsHistoryResponseBackendDict>{
        results: [taskDict],
        cursor: 'cursor123',
        more: true,
      });
      flushMicrotasks();

      expect(await response).toEqual(
        new ExplorationImprovementsHistoryResponse(
          [highBounceRateTaskObjectFactory.createFromBackendDict(taskDict)],
          'cursor123',
          true));
    }));

  it('should return an ExplorationImprovementsHistoryResponse when given a ' +
    'cursor', fakeAsync(async() => {
    const taskDict: ITaskEntryBackendDict = {
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolver_profile_picture_data_url: './image.png',
      resolved_on_msecs: 123456789,
    };

    const response = (
      improvementsBackendApiService.getHistoryPageAsync('eid', 'cursor123'));

    const req = httpTestingController.expectOne(
      '/improvements/history/exploration/eid?cursor=cursor123');
    expect(req.request.method).toEqual('GET');
    req.flush(<IExplorationImprovementsHistoryResponseBackendDict>{
      results: [taskDict],
      cursor: 'cursor456',
      more: false,
    });
    flushMicrotasks();

    expect(await response).toEqual(
      new ExplorationImprovementsHistoryResponse(
        [highBounceRateTaskObjectFactory.createFromBackendDict(taskDict)],
        'cursor456',
        false));
  }));

  it('should try to post a task dict to the backend', fakeAsync(async() => {
    const task: HighBounceRateTask = (
      highBounceRateTaskObjectFactory.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'high_bounce_rate',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '20% of learners dropped at this state',
        status: 'resolved',
        resolver_username: 'test_user',
        resolver_profile_picture_data_url: './image.png',
        resolved_on_msecs: 123456789,
      }));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onFailure = jasmine.createSpy('onFailure');
    improvementsBackendApiService.postTasksAsync('eid', [task])
      .then(onSuccess, onFailure);

    const req = (
      httpTestingController.expectOne('/improvements/exploration/eid'));
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      task_entries: [task.toPayloadDict()]
    });
    req.flush({});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));
});
