from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Comment, Request, RequestStatus, RequestStatusHistory, RequestType, UserRole

User = get_user_model()


class RequestApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='jean@uqo.ca',
            username='jean',
            password='password123',
            role=UserRole.USER,
        )
        self.other_user = User.objects.create_user(
            email='marie@uqo.ca',
            username='marie',
            password='password123',
            role=UserRole.USER,
        )
        self.manager = User.objects.create_user(
            email='manager@uqo.ca',
            username='manager',
            password='password123',
            role=UserRole.MANAGER,
        )

        self.user_client = APIClient()
        self.user_client.force_authenticate(user=self.user)

        self.other_user_client = APIClient()
        self.other_user_client.force_authenticate(user=self.other_user)

        self.manager_client = APIClient()
        self.manager_client.force_authenticate(user=self.manager)

    def _create_request(self, author, status_value=RequestStatus.SUBMITTED):
        return Request.objects.create(
            title='Demande test reseau',
            description='Description suffisamment longue pour valider la demande.',
            type=RequestType.INFRASTRUCTURE,
            status=status_value,
            author=author,
        )

    def test_register_valid_defaults_to_user_role(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'newuser@uqo.ca',
                'full_name': 'New User',
                'password': 'Password123!',
                'confirm_password': 'Password123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = User.objects.get(email='newuser@uqo.ca')
        self.assertEqual(created.role, UserRole.USER)

    def test_register_cannot_set_manager_role(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'newuser2@uqo.ca',
                'full_name': 'New User 2',
                'password': 'Password123!',
                'confirm_password': 'Password123!',
                'role': UserRole.MANAGER,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.json())

    def test_login_valid_returns_tokens(self):
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'jean@uqo.ca', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn('access', body)
        self.assertIn('refresh', body)
        self.assertEqual(body['user']['email'], 'jean@uqo.ca')

    def test_register_requires_password_confirmation_match(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'badconfirm@uqo.ca',
                'full_name': 'Bad Confirm',
                'password': 'Password123!',
                'confirm_password': 'PasswordABC!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.json())

    def test_register_rejects_duplicate_email_case_insensitive(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'JEAN@UQO.CA',
                'full_name': 'Jean Duplicate',
                'password': 'Password123!',
                'confirm_password': 'Password123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.json())

    def test_register_rejects_short_password(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'shortpwd@uqo.ca',
                'full_name': 'Short Password',
                'password': 'Abc123!',
                'confirm_password': 'Abc123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.json())

    def test_authenticated_user_cannot_register_again(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'another@uqo.ca',
                'full_name': 'Another User',
                'password': 'Password123!',
                'confirm_password': 'Password123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.json())

    def test_access_without_token_is_denied(self):
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_request_valid_sets_status_and_author(self):
        response = self.user_client.post(
            '/api/requests/',
            {
                'title': 'Besoin nouveau routeur',
                'description': "Le routeur de l'etage 2 tombe chaque jour.",
                'type': RequestType.INFRASTRUCTURE,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Request.objects.get(pk=response.json()['id'])
        self.assertEqual(created.status, RequestStatus.SUBMITTED)
        self.assertEqual(created.author_id, self.user.id)

    def test_create_request_invalid_payload_returns_400(self):
        response = self.user_client.post(
            '/api/requests/',
            {
                'title': 'abc',
                'description': 'court',
                'type': RequestType.SOFTWARE,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.json())
        self.assertIn('description', response.json())

    def test_user_cannot_access_other_user_request(self):
        request_obj = self._create_request(author=self.other_user)
        response = self.user_client.get(f'/api/requests/{request_obj.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_list_returns_only_own_requests(self):
        own_request = self._create_request(author=self.user)
        self._create_request(author=self.other_user)

        response = self.user_client.get('/api/requests/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.json()}
        self.assertEqual(ids, {own_request.id})

    def test_manager_list_returns_all_requests(self):
        request_one = self._create_request(author=self.user)
        request_two = self._create_request(author=self.other_user)

        response = self.manager_client.get('/api/requests/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.json()}
        self.assertEqual(ids, {request_one.id, request_two.id})

    def test_user_can_update_own_submitted_request(self):
        request_obj = self._create_request(author=self.user)

        response = self.user_client.patch(
            f'/api/requests/{request_obj.id}/',
            {'title': 'Titre modifie par user'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        request_obj.refresh_from_db()
        self.assertEqual(request_obj.title, 'Titre modifie par user')

    def test_user_cannot_update_request_when_in_progress(self):
        request_obj = self._create_request(author=self.user, status_value=RequestStatus.IN_PROGRESS)

        response = self.user_client.patch(
            f'/api/requests/{request_obj.id}/',
            {'title': 'Nouveau titre interdit'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_manager_can_change_status(self):
        request_obj = self._create_request(author=self.user)

        user_response = self.user_client.post(
            f'/api/requests/{request_obj.id}/change-status/',
            {'status': RequestStatus.IN_PROGRESS},
            format='json',
        )
        self.assertEqual(user_response.status_code, status.HTTP_403_FORBIDDEN)

        manager_response = self.manager_client.post(
            f'/api/requests/{request_obj.id}/change-status/',
            {'status': RequestStatus.IN_PROGRESS},
            format='json',
        )
        self.assertEqual(manager_response.status_code, status.HTTP_200_OK)
        request_obj.refresh_from_db()
        self.assertEqual(request_obj.status, RequestStatus.IN_PROGRESS)

    def test_forbidden_status_transition_is_rejected(self):
        request_obj = self._create_request(author=self.user)

        first_response = self.manager_client.post(
            f'/api/requests/{request_obj.id}/change-status/',
            {'status': RequestStatus.IN_PROGRESS},
            format='json',
        )
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)

        second_response = self.manager_client.post(
            f'/api/requests/{request_obj.id}/change-status/',
            {'status': RequestStatus.SUBMITTED},
            format='json',
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_status_creates_history_entry_and_comment(self):
        create_response = self.user_client.post(
            '/api/requests/',
            {
                'title': 'Demande switch coeur',
                'description': 'Le switch coeur est instable depuis ce matin.',
                'type': RequestType.HARDWARE,
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        request_id = create_response.json()['id']

        response = self.manager_client.post(
            f'/api/requests/{request_id}/change-status/',
            {'status': RequestStatus.IN_PROGRESS, 'comment': 'Prise en charge immediatement'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        request_obj = Request.objects.get(pk=request_id)
        self.assertEqual(request_obj.status, RequestStatus.IN_PROGRESS)
        self.assertTrue(
            RequestStatusHistory.objects.filter(
                request=request_obj,
                from_status=RequestStatus.SUBMITTED,
                to_status=RequestStatus.IN_PROGRESS,
            ).exists()
        )
        self.assertTrue(
            Comment.objects.filter(
                request=request_obj,
                author=self.manager,
                content='Prise en charge immediatement',
            ).exists()
        )

    def test_manager_can_add_comment(self):
        request_obj = self._create_request(author=self.user)

        response = self.manager_client.post(
            f'/api/requests/{request_obj.id}/comments/',
            {'content': 'Commentaire de suivi'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.filter(request=request_obj).count(), 1)

    def test_user_cannot_add_comment(self):
        request_obj = self._create_request(author=self.user)

        response = self.user_client.post(
            f'/api/requests/{request_obj.id}/comments/',
            {'content': 'Tentative interdite'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_cannot_view_comments_of_other_user_request(self):
        request_obj = self._create_request(author=self.other_user)

        response = self.user_client.get(f'/api/requests/{request_obj.id}/comments/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_cannot_add_blank_comment(self):
        request_obj = self._create_request(author=self.user)

        response = self.manager_client.post(
            f'/api/requests/{request_obj.id}/comments/',
            {'content': '   '},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('content', response.json())

    def test_user_cannot_delete_request_when_not_submitted(self):
        request_obj = self._create_request(author=self.user, status_value=RequestStatus.IN_PROGRESS)

        response = self.user_client.delete(f'/api/requests/{request_obj.id}/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Request.objects.filter(pk=request_obj.id).exists())

    def test_manager_can_delete_request_regardless_of_status(self):
        request_obj = self._create_request(author=self.user, status_value=RequestStatus.IN_PROGRESS)

        response = self.manager_client.delete(f'/api/requests/{request_obj.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Request.objects.filter(pk=request_obj.id).exists())
